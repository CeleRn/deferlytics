import { describe, expect, it, vi } from "vitest";
import type { DeferlyticsWindow } from "../src/core/types";
import { DeferlyticsRuntime } from "../src/runtime/runtime";

describe("runtime", () => {
  it("blocks vendor loading when required consent is pending", () => {
    vi.useFakeTimers();
    const runtime = new DeferlyticsRuntime();

    runtime.init({
      loadStrategy: "immediate",
      consent: {
        required: true,
        defaultStatus: "pending",
      },
      vendors: {
        ga4: {
          enabled: true,
          measurementId: "G-TEST",
        },
      },
    });
    vi.runAllTimers();

    expect(document.querySelector("script[id='deferlytics-ga4-G-TEST']")).toBeNull();
    vi.useRealTimers();
  });

  it("uses queued bootstrap consent as initial runtime consent", async () => {
    vi.useFakeTimers();
    const win = window as DeferlyticsWindow;
    win.__fastAnalyticsQueue = [
      {
        id: "consent-1",
        type: "consent",
        name: "granted",
        timestamp: 1,
        relativeTime: 1,
        url: "https://example.com",
        path: "/",
        title: "Example",
        referrer: "",
        userAgent: "",
      },
    ];
    const runtime = new DeferlyticsRuntime();

    runtime.init({
      loadStrategy: "immediate",
      consent: {
        required: true,
        defaultStatus: "pending",
      },
      vendors: {
        ga4: {
          enabled: true,
          measurementId: "G-TEST",
        },
      },
    });
    vi.runAllTimers();

    expect(document.querySelector("script[id='deferlytics-ga4-G-TEST']")).not.toBeNull();
    vi.useRealTimers();
  });
});
