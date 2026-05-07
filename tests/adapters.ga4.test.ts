import { describe, expect, it } from "vitest";
import { createGa4Adapter } from "../src/adapters/ga4";
import type { DeferlyticsWindow } from "../src/core/types";

describe("ga4 adapter", () => {
  it("maps page and custom events to gtag calls", async () => {
    const script = document.createElement("script");
    script.id = "deferlytics-ga4-G-TEST";
    script.src = "https://www.googletagmanager.com/gtag/js?id=G-TEST";
    script.dataset.deferlyticsLoaded = "true";
    document.head.appendChild(script);

    const adapter = createGa4Adapter({ enabled: true, measurementId: "G-TEST" });
    await adapter.init();

    adapter.dispatch({
      id: "1",
      type: "page",
      timestamp: 1,
      relativeTime: 1,
      url: "https://example.com/a",
      path: "/a",
      title: "A",
      referrer: "",
      userAgent: "",
    });
    adapter.dispatch({
      id: "2",
      type: "event",
      name: "signup",
      params: { plan: "pro" },
      timestamp: 1,
      relativeTime: 1,
      url: "https://example.com/a",
      path: "/a",
      title: "A",
      referrer: "",
      userAgent: "",
    });

    const win = window as DeferlyticsWindow;
    expect(win.dataLayer).toContainEqual([
      "event",
      "page_view",
      expect.objectContaining({ page_path: "/a" }),
    ]);
    expect(win.dataLayer).toContainEqual(["event", "signup", { plan: "pro" }]);
  });
});
