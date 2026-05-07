import { describe, expect, it } from "vitest";
import { createYandexMetricaAdapter } from "../src/adapters/yandexMetrica";
import type { DeferlyticsWindow } from "../src/core/types";

describe("yandex metrica adapter", () => {
  it("maps page and custom events to ym calls", async () => {
    const script = document.createElement("script");
    script.id = "deferlytics-yandex-metrica";
    script.src = "https://mc.yandex.ru/metrika/tag.js";
    script.dataset.deferlyticsLoaded = "true";
    document.head.appendChild(script);

    const adapter = createYandexMetricaAdapter({ enabled: true, counterId: 123 });
    await adapter.init();

    adapter.dispatch({
      id: "1",
      type: "page",
      timestamp: 1,
      relativeTime: 1,
      url: "https://example.com/a",
      path: "/a",
      title: "A",
      referrer: "https://example.com",
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
    expect(win.ym?.a).toContainEqual([
      123,
      "hit",
      "https://example.com/a",
      expect.objectContaining({ title: "A" }),
    ]);
    expect(win.ym?.a).toContainEqual([123, "reachGoal", "signup", { plan: "pro" }]);
  });

  it("initializes and dispatches to every counter id", async () => {
    const script = document.createElement("script");
    script.id = "deferlytics-yandex-metrica";
    script.src = "https://mc.yandex.ru/metrika/tag.js";
    script.dataset.deferlyticsLoaded = "true";
    document.head.appendChild(script);

    const adapter = createYandexMetricaAdapter({
      enabled: true,
      counterIds: [123, 456],
    });
    await adapter.init();

    adapter.dispatch({
      id: "1",
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
    expect(win.ym?.a).toContainEqual([
      123,
      "init",
      expect.objectContaining({ defer: true }),
    ]);
    expect(win.ym?.a).toContainEqual([
      456,
      "init",
      expect.objectContaining({ defer: true }),
    ]);
    expect(win.ym?.a).toContainEqual([123, "reachGoal", "signup", { plan: "pro" }]);
    expect(win.ym?.a).toContainEqual([456, "reachGoal", "signup", { plan: "pro" }]);
  });
});
