export {
  consent,
  flush,
  identify,
  init,
  loadVendors,
  page,
  track,
} from "./runtime/init";

export type {
  AnalyticsEvent,
  AnalyticsEventType,
  ConsentStatus,
  FastAnalyticsApi,
  FastAnalyticsConfig,
  Ga4Config,
  LoadStrategy,
  VendorConfig,
  YandexMetricaConfig,
} from "./core/types";
