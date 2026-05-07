import type {
  AnalyticsEvent,
  AnalyticsEventType,
  ConsentStatus,
  DeferlyticsWindow,
  FastAnalyticsConfig,
} from "../core/types";

const win = typeof window !== "undefined" ? (window as DeferlyticsWindow) : undefined;

if (win) {
  const queue = (win.__fastAnalyticsQueue = win.__fastAnalyticsQueue ?? []);
  const start = (win.__fastAnalyticsStart = win.__fastAnalyticsStart ?? now());

  let maxQueueSize = win.__fastAnalyticsConfig?.maxQueueSize ?? 100;
  let idCounter = 0;

  function createEvent(
    type: AnalyticsEventType,
    name?: string,
    params?: Record<string, unknown>,
  ): AnalyticsEvent {
    return {
      id: `${Date.now()}-${++idCounter}`,
      type,
      name,
      params,
      timestamp: Date.now(),
      relativeTime: Math.max(0, now() - start),
      url: win?.location.href ?? "",
      path: win?.location.pathname ?? "",
      title: win?.document.title ?? "",
      referrer: win?.document.referrer ?? "",
      userAgent: win?.navigator.userAgent ?? "",
    };
  }

  function enqueue(event: AnalyticsEvent): void {
    queue.push(event);
    while (queue.length > maxQueueSize) {
      queue.shift();
    }
  }

  win.fastAnalytics = win.fastAnalytics ?? {
    init(config: FastAnalyticsConfig): void {
      win.__fastAnalyticsConfig = config;
      maxQueueSize = config.maxQueueSize ?? maxQueueSize;
      while (queue.length > maxQueueSize) {
        queue.shift();
      }
    },
    page(params?: Record<string, unknown>): void {
      enqueue(createEvent("page", undefined, params));
    },
    track(eventName: string, params?: Record<string, unknown>): void {
      enqueue(createEvent("event", eventName, params));
    },
    identify(userId: string, traits?: Record<string, unknown>): void {
      enqueue(createEvent("identify", userId, { userId, ...traits }));
    },
    consent(status: ConsentStatus): void {
      enqueue(createEvent("consent", status));
    },
    flush(): void {
      queue.length = 0;
    },
    loadVendors(): void {
      win.__fastAnalyticsConfig = {
        ...win.__fastAnalyticsConfig,
        loadStrategy: "immediate",
      };
    },
  };
}

function now(): number {
  return win?.performance?.now ? win.performance.now() : Date.now();
}
