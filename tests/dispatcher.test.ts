import { describe, expect, it, vi } from "vitest";
import type { AnalyticsAdapter } from "../src/adapters/types";
import { Dispatcher } from "../src/core/dispatcher";
import type { AnalyticsEvent } from "../src/core/types";

describe("dispatcher", () => {
  it("replays every event once and ignores duplicates", async () => {
    const dispatch = vi.fn();
    const adapter: AnalyticsAdapter = {
      name: "test",
      enabled: true,
      init: vi.fn().mockResolvedValue(undefined),
      dispatch,
      isReady: () => true,
    };
    const dispatcher = new Dispatcher([adapter]);
    const analyticsEvent = event("1");

    await dispatcher.init();
    dispatcher.replay([analyticsEvent, analyticsEvent]);

    expect(dispatch).toHaveBeenCalledTimes(1);
  });
});

function event(id: string): AnalyticsEvent {
  return {
    id,
    type: "event",
    name: "signup",
    timestamp: 1,
    relativeTime: 1,
    url: "https://example.com",
    path: "/",
    title: "Example",
    referrer: "",
    userAgent: "test",
  };
}
