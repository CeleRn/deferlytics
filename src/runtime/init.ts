import { DeferlyticsRuntime } from "./runtime";
import type {
  ConsentStatus,
  FastAnalyticsApi,
  FastAnalyticsConfig,
} from "../core/types";
import { getBrowserWindow } from "../core/utils";

let runtime: DeferlyticsRuntime | undefined;

export function getRuntime(): DeferlyticsRuntime {
  if (!runtime) {
    runtime = new DeferlyticsRuntime(getBrowserWindow()?.__fastAnalyticsConfig);
  }

  return runtime;
}

export function init(config: FastAnalyticsConfig): void {
  getRuntime().init(config);
}

export function page(params?: Record<string, unknown>): void {
  getRuntime().page(params);
}

export function track(eventName: string, params?: Record<string, unknown>): void {
  getRuntime().track(eventName, params);
}

export function identify(userId: string, traits?: Record<string, unknown>): void {
  getRuntime().identify(userId, traits);
}

export function consent(status: ConsentStatus): void {
  getRuntime().consent(status);
}

export function flush(): void {
  getRuntime().flush();
}

export function loadVendors(): Promise<void> | void {
  return getRuntime().loadVendors();
}

export function installGlobalApi(): FastAnalyticsApi {
  const api = getRuntime();
  const win = getBrowserWindow();
  if (win) {
    win.fastAnalytics = api;
    win.__deferlyticsRuntime = api;
  }

  return api;
}
