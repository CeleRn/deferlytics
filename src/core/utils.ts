import type {
  AnalyticsEvent,
  CreateEventInput,
  DeferlyticsWindow,
} from "./types";

let idCounter = 0;

export function getBrowserWindow(): DeferlyticsWindow | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window as DeferlyticsWindow;
}

export function now(): number {
  const win = getBrowserWindow();
  return win?.performance?.now ? win.performance.now() : Date.now();
}

export function createEvent(input: CreateEventInput): AnalyticsEvent {
  const win = getBrowserWindow();
  const location = win?.location;
  const documentRef = win?.document;
  const timestamp = Date.now();
  const start = win?.__fastAnalyticsStart ?? 0;
  const relativeTime = Math.max(0, now() - start);

  return {
    id: `${timestamp}-${++idCounter}`,
    type: input.type,
    name: input.name,
    params: input.params,
    timestamp,
    relativeTime,
    url: location?.href ?? "",
    path: location?.pathname ?? "",
    title: documentRef?.title ?? "",
    referrer: documentRef?.referrer ?? "",
    userAgent: win?.navigator?.userAgent ?? "",
  };
}

export function debugLog(enabled: boolean | undefined, ...args: unknown[]): void {
  if (!enabled) {
    return;
  }

  getBrowserWindow()?.console?.debug?.("[deferlytics]", ...args);
}
