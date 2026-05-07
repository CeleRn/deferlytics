import { createGa4Adapter } from "../adapters/ga4";
import type { AnalyticsAdapter } from "../adapters/types";
import { createYandexMetricaAdapter } from "../adapters/yandexMetrica";
import { createConsentManager } from "../core/consent";
import { DEFAULT_CONFIG, mergeConfig } from "../core/defaults";
import { Dispatcher } from "../core/dispatcher";
import { scheduleLoad } from "../core/loadStrategies";
import { createQueue, type AnalyticsQueue } from "../core/queue";
import { shouldSkipAnalytics } from "../core/botDetector";
import type {
  AnalyticsEvent,
  ConsentStatus,
  FastAnalyticsApi,
  FastAnalyticsConfig,
} from "../core/types";
import { createEvent, debugLog, getBrowserWindow } from "../core/utils";

export type RuntimeStatus =
  | "idle"
  | "scheduled"
  | "loading"
  | "ready"
  | "skipped"
  | "error";

export class DeferlyticsRuntime implements FastAnalyticsApi {
  private config: FastAnalyticsConfig;
  private readonly queue: AnalyticsQueue;
  private consentManager: ReturnType<typeof createConsentManager>;
  private unsubscribeConsent?: () => void;
  private dispatcher?: Dispatcher;
  private status: RuntimeStatus = "idle";
  private live = false;
  private loadingPromise?: Promise<void>;
  private cancelScheduledLoad?: () => void;

  constructor(config: FastAnalyticsConfig = {}) {
    this.config = mergeConfig(config);
    const win = getBrowserWindow();
    const queueEvents = win?.__fastAnalyticsQueue ?? [];

    if (win) {
      win.__fastAnalyticsQueue = queueEvents;
    }

    this.queue = createQueue({
      events: queueEvents,
      maxSize: this.config.maxQueueSize ?? DEFAULT_CONFIG.maxQueueSize,
      onDrop: (event) => debugLog(this.config.debug, "queue overflow, dropped", event),
    });
    this.consentManager = this.createSubscribedConsentManager();
  }

  init(config: FastAnalyticsConfig): void {
    this.config = mergeConfig({
      ...this.config,
      ...config,
      consent: {
        ...this.config.consent,
        ...config.consent,
      },
      vendors: {
        ...this.config.vendors,
        ...config.vendors,
      },
    });
    const queuedConsentStatus = this.getLatestQueuedConsentStatus();
    if (queuedConsentStatus) {
      this.config = {
        ...this.config,
        consent: {
          ...this.config.consent,
          defaultStatus: queuedConsentStatus,
        },
      };
    }
    this.unsubscribeConsent?.();
    this.consentManager = this.createSubscribedConsentManager();
    this.queue.setMaxSize(this.config.maxQueueSize ?? DEFAULT_CONFIG.maxQueueSize);

    const win = getBrowserWindow();
    if (win) {
      win.__fastAnalyticsConfig = this.config;
      win.fastAnalytics = this;
      win.__deferlyticsRuntime = this;
    }

    if (shouldSkipAnalytics(this.config)) {
      this.status = "skipped";
      debugLog(this.config.debug, "analytics skipped for bot or synthetic environment");
      return;
    }

    if (!this.consentManager.canLoadVendors()) {
      debugLog(this.config.debug, "vendor loading blocked by consent");
      return;
    }

    this.scheduleVendorLoad();
  }

  page(params?: Record<string, unknown>): void {
    this.enqueueOrDispatch(createEvent({ type: "page", params }));
  }

  track(eventName: string, params?: Record<string, unknown>): void {
    this.enqueueOrDispatch(createEvent({ type: "event", name: eventName, params }));
  }

  identify(userId: string, traits?: Record<string, unknown>): void {
    this.enqueueOrDispatch(
      createEvent({
        type: "identify",
        name: userId,
        params: {
          userId,
          ...traits,
        },
      }),
    );
  }

  consent(status: ConsentStatus): void {
    this.consentManager.setStatus(status);
  }

  flush(): void {
    this.queue.flush();
  }

  loadVendors(): Promise<void> {
    if (this.status === "skipped") {
      return Promise.resolve();
    }

    if (!this.consentManager.canLoadVendors()) {
      debugLog(this.config.debug, "manual vendor loading blocked by consent");
      return Promise.resolve();
    }

    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    this.cancelScheduledLoad?.();
    this.status = "loading";

    this.loadingPromise = this.loadVendorsInternal()
      .then(() => {
        this.status = "ready";
        this.live = true;
      })
      .catch((error) => {
        this.status = "error";
        debugLog(this.config.debug, "vendor loading failed", error);
      });

    return this.loadingPromise;
  }

  getStatus(): RuntimeStatus {
    return this.status;
  }

  private scheduleVendorLoad(): void {
    if (this.config.loadStrategy === "manual") {
      return;
    }

    if (this.status === "scheduled" || this.status === "loading" || this.status === "ready") {
      return;
    }

    this.status = "scheduled";
    this.cancelScheduledLoad = scheduleLoad(
      this.config.loadStrategy ?? DEFAULT_CONFIG.loadStrategy,
      () => {
        void this.loadVendors();
      },
      { timeout: this.config.loadTimeout ?? DEFAULT_CONFIG.loadTimeout },
    );
  }

  private async loadVendorsInternal(): Promise<void> {
    const adapters = this.createAdapters();
    this.dispatcher = new Dispatcher(adapters, { debug: this.config.debug });

    await this.dispatcher.init();

    if (!this.dispatcher.hasReadyAdapter()) {
      debugLog(this.config.debug, "no ready analytics adapters");
      return;
    }

    this.dispatcher.replay(this.queue.drain());
  }

  private createAdapters(): AnalyticsAdapter[] {
    const adapters: AnalyticsAdapter[] = [];

    if (this.config.vendors?.ga4) {
      adapters.push(createGa4Adapter(this.config.vendors.ga4));
    }

    if (this.config.vendors?.yandexMetrica) {
      adapters.push(createYandexMetricaAdapter(this.config.vendors.yandexMetrica));
    }

    return adapters;
  }

  private createSubscribedConsentManager(): ReturnType<typeof createConsentManager> {
    const consentManager = createConsentManager(this.config.consent);
    this.unsubscribeConsent = consentManager.subscribe((status) => {
      this.enqueueOrDispatch(createEvent({ type: "consent", name: status }));
      if (status === "granted") {
        void this.loadVendors();
      }
    });
    return consentManager;
  }

  private getLatestQueuedConsentStatus(): ConsentStatus | undefined {
    return this.queue
      .peek()
      .filter(isConsentEvent)
      .at(-1)?.name;
  }

  private enqueueOrDispatch(event: ReturnType<typeof createEvent>): void {
    if (this.live && this.dispatcher?.hasReadyAdapter()) {
      this.dispatcher.dispatch(event);
      return;
    }

    this.queue.enqueue(event);
  }
}

function isConsentEvent(
  event: AnalyticsEvent,
): event is AnalyticsEvent & { name: ConsentStatus } {
  return (
    event.type === "consent" &&
    (event.name === "granted" || event.name === "denied" || event.name === "pending")
  );
}
