import type { AnalyticsAdapter } from "./types";
import type { YandexMetricaConfig } from "../core/types";
import { loadScript } from "../core/scriptLoader";
import { getBrowserWindow } from "../core/utils";

export function createYandexMetricaAdapter(config: YandexMetricaConfig): AnalyticsAdapter {
  let ready = false;
  const counterIds = resolveCounterIds(config);

  return {
    name: "yandexMetrica",
    enabled: config.enabled !== false && counterIds.length > 0,
    async init() {
      const win = getBrowserWindow();
      if (!win || counterIds.length === 0) {
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

      for (const counterId of counterIds) {
        win.ym(counterId, "init", {
          defer: config.defer ?? true,
          clickmap: config.clickmap ?? true,
          trackLinks: config.trackLinks ?? true,
          accurateTrackBounce: config.accurateTrackBounce ?? true,
          webvisor: config.webvisor ?? false,
        });
      }

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
        for (const counterId of counterIds) {
          win.ym(counterId, "hit", event.url, {
            title: event.title,
            referer: event.referrer,
            ...event.params,
          });
        }
        return;
      }

      if (event.type === "event" && event.name) {
        for (const counterId of counterIds) {
          win.ym(counterId, "reachGoal", event.name, event.params ?? {});
        }
        return;
      }

      if (event.type === "identify") {
        for (const counterId of counterIds) {
          win.ym(counterId, "userParams", event.params ?? {});
        }
      }
    },
    isReady() {
      return ready;
    },
  };
}

function resolveCounterIds(config: YandexMetricaConfig): number[] {
  const ids = [config.counterId, config.counterIds]
    .flat()
    .filter((id): id is number => typeof id === "number" && Number.isFinite(id));

  return Array.from(new Set(ids));
}
