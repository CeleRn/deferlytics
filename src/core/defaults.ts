import type { FastAnalyticsConfig } from "./types";

export const DEFAULT_CONFIG: Required<
  Pick<
    FastAnalyticsConfig,
    | "debug"
    | "loadStrategy"
    | "loadTimeout"
    | "skipBots"
    | "skipLighthouse"
    | "maxQueueSize"
  >
> &
  Pick<FastAnalyticsConfig, "consent" | "vendors"> = {
  debug: false,
  loadStrategy: "idle",
  loadTimeout: 3000,
  skipBots: true,
  skipLighthouse: true,
  maxQueueSize: 100,
  consent: {
    required: false,
    defaultStatus: "granted",
  },
  vendors: {},
};

export function mergeConfig(config: FastAnalyticsConfig = {}): FastAnalyticsConfig {
  return {
    ...DEFAULT_CONFIG,
    ...config,
    consent: {
      ...DEFAULT_CONFIG.consent,
      ...config.consent,
    },
    vendors: {
      ...DEFAULT_CONFIG.vendors,
      ...config.vendors,
    },
  };
}
