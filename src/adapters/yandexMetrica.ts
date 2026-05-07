import type { AnalyticsAdapter } from "./types";
import type { YandexMetricaConfig } from "../core/types";
import { loadScript } from "../core/scriptLoader";
import { getBrowserWindow } from "../core/utils";

export function createYandexMetricaAdapter(config: YandexMetricaConfig): AnalyticsAdapter {
  let ready = false;

  return {
    name: "yandexMetrica",
    enabled: config.enabled !== false && Number.isFinite(config.counterId),
    async init() {
      const win = getBrowserWindow();
      if (!win || !Number.isFinite(config.counterId)) {
        return;
      }

      win.ym =
        win.ym ??
        Object.assign(
          function ym(...args: unknown[]) {
            win.ym?.a?.push(args);
          },
          { a: [] as unknown[][], l: Date.now() },
        );

      win.ym(config.counterId, "init", {
        defer: config.defer ?? true,
        clickmap: config.clickmap ?? true,
        trackLinks: config.trackLinks ?? true,
        accurateTrackBounce: config.accurateTrackBounce ?? true,
        webvisor: config.webvisor ?? false,
      });

      await loadScript("https://mc.yandex.ru/metrika/tag.js", {
        id: "deferlytics-yandex-metrica",
      });

      ready = true;
    },
    dispatch(event) {
      const win = getBrowserWindow();
      if (!win?.ym) {
        return;
      }

      if (event.type === "page") {
        win.ym(config.counterId, "hit", event.url, {
          title: event.title,
          referer: event.referrer,
          ...event.params,
        });
        return;
      }

      if (event.type === "event" && event.name) {
        win.ym(config.counterId, "reachGoal", event.name, event.params ?? {});
        return;
      }

      if (event.type === "identify") {
        win.ym(config.counterId, "userParams", event.params ?? {});
      }
    },
    isReady() {
      return ready;
    },
  };
}
