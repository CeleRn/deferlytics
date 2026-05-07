export type AnalyticsEventType =
  | "page"
  | "event"
  | "identify"
  | "timing"
  | "consent";

export type ConsentStatus = "granted" | "denied" | "pending";

export type LoadStrategy =
  | "immediate"
  | "load"
  | "idle"
  | "interaction"
  | "timeout"
  | "manual";

export interface AnalyticsEvent {
  id: string;
  type: AnalyticsEventType;
  name?: string;
  params?: Record<string, unknown>;
  timestamp: number;
  relativeTime: number;
  url: string;
  path: string;
  title: string;
  referrer: string;
  userAgent: string;
}

export interface ConsentConfig {
  required?: boolean;
  defaultStatus?: ConsentStatus;
}

export interface Ga4Config {
  enabled?: boolean;
  measurementId?: string | string[];
  measurementIds?: string[];
  sendPageView?: boolean;
}

export interface YandexMetricaConfig {
  enabled?: boolean;
  counterId?: number | number[];
  counterIds?: number[];
  webvisor?: boolean;
  clickmap?: boolean;
  trackLinks?: boolean;
  accurateTrackBounce?: boolean;
  defer?: boolean;
}

export interface VendorConfig {
  ga4?: Ga4Config;
  yandexMetrica?: YandexMetricaConfig;
}

export interface FastAnalyticsConfig {
  debug?: boolean;
  loadStrategy?: LoadStrategy;
  loadTimeout?: number;
  skipBots?: boolean;
  skipLighthouse?: boolean;
  maxQueueSize?: number;
  consent?: ConsentConfig;
  vendors?: VendorConfig;
}

export interface FastAnalyticsApi {
  init(config: FastAnalyticsConfig): void;
  page(params?: Record<string, unknown>): void;
  track(eventName: string, params?: Record<string, unknown>): void;
  identify(userId: string, traits?: Record<string, unknown>): void;
  consent(status: ConsentStatus): void;
  flush(): void;
  loadVendors(): Promise<void> | void;
}

export interface DeferlyticsWindow extends Window {
  console?: Console;
  fastAnalytics?: FastAnalyticsApi;
  __fastAnalyticsQueue?: AnalyticsEvent[];
  __fastAnalyticsConfig?: FastAnalyticsConfig;
  __fastAnalyticsStart?: number;
  __deferlyticsRuntime?: unknown;
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  ym?: YandexMetricaFn;
}

export type YandexMetricaFn = {
  (...args: unknown[]): void;
  a?: unknown[][];
  l?: number;
};

export interface CreateEventInput {
  type: AnalyticsEventType;
  name?: string;
  params?: Record<string, unknown>;
}
