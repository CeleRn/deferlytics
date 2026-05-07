import type { LoadStrategy } from "./types";
import { getBrowserWindow } from "./utils";

export interface LoadStrategyOptions {
  timeout?: number;
}

export type CancelLoadStrategy = () => void;

export function scheduleLoad(
  strategy: LoadStrategy = "idle",
  callback: () => void,
  options: LoadStrategyOptions = {},
): CancelLoadStrategy {
  const win = getBrowserWindow();
  if (!win || strategy === "manual") {
    return noop;
  }

  let called = false;
  let cancel = noop;

  const runOnce = () => {
    if (called) {
      return;
    }

    called = true;
    cancel();
    callback();
  };

  if (strategy === "immediate") {
    const timer = win.setTimeout(runOnce, 0);
    return () => win.clearTimeout(timer);
  }

  if (strategy === "timeout") {
    const timer = win.setTimeout(runOnce, options.timeout ?? 3000);
    return () => win.clearTimeout(timer);
  }

  if (strategy === "load") {
    if (win.document.readyState === "complete") {
      const timer = win.setTimeout(runOnce, 0);
      return () => win.clearTimeout(timer);
    }

    win.addEventListener("load", runOnce, { once: true });
    return () => win.removeEventListener("load", runOnce);
  }

  if (strategy === "interaction") {
    const events = ["click", "scroll", "keydown", "touchstart", "pointerdown"];
    cancel = () => {
      events.forEach((eventName) => win.removeEventListener(eventName, runOnce));
    };
    events.forEach((eventName) => win.addEventListener(eventName, runOnce, { passive: true }));
    return cancel;
  }

  const requestIdleCallback = win.requestIdleCallback;
  if (typeof requestIdleCallback === "function") {
    const idleId = requestIdleCallback(runOnce, { timeout: options.timeout ?? 3000 });
    return () => win.cancelIdleCallback?.(idleId);
  }

  const timer = win.setTimeout(runOnce, options.timeout ?? 3000);
  return () => win.clearTimeout(timer);
}

function noop(): void {
  // Intentionally empty.
}
