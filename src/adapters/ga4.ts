import type { AnalyticsAdapter } from "./types";
import type { AnalyticsEvent, Ga4Config } from "../core/types";
import { loadScript } from "../core/scriptLoader";
import { getBrowserWindow } from "../core/utils";

export function createGa4Adapter(config: Ga4Config): AnalyticsAdapter {
  let ready = false;
  const measurementIds = resolveMeasurementIds(config);

  return {
    name: "ga4",
    enabled: config.enabled !== false && measurementIds.length > 0,
    async init() {
      const win = getBrowserWindow();
      if (!win || measurementIds.length === 0) {
        return;
      }

      win.dataLayer = win.dataLayer ?? [];
      win.gtag =
        win.gtag ??
        function gtag(...args: unknown[]) {
          win.dataLayer?.push(args);
        };

      win.gtag("js", new Date());
      for (const measurementId of measurementIds) {
        win.gtag("config", measurementId, {
          send_page_view: config.sendPageView ?? false,
        });
      }

      const primaryMeasurementId = measurementIds[0];
      await loadScript(
        `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
          primaryMeasurementId,
        )}`,
        { id: `deferlytics-ga4-${primaryMeasurementId}` },
      );

      ready = true;
    },
    dispatch(event) {
      const win = getBrowserWindow();
      if (!win?.gtag) {
        return;
      }

      if (event.type === "page") {
        win.gtag("event", "page_view", {
          page_location: event.url,
          page_path: event.path,
          page_title: event.title,
          ...event.params,
        });
        return;
      }

      if (event.type === "event" && event.name) {
        win.gtag("event", event.name, event.params ?? {});
        return;
      }

      if (event.type === "identify") {
        const userId = event.name ?? event.params?.userId;
        if (userId) {
          win.gtag("set", "user_id", userId);
        }
        return;
      }

      if (event.type === "timing") {
        win.gtag("event", "timing_complete", event.params ?? {});
      }
    },
    isReady() {
      return ready;
    },
  };
}

function resolveMeasurementIds(config: Ga4Config): string[] {
  const ids = [config.measurementId, config.measurementIds]
    .flat()
    .filter((id): id is string => typeof id === "string" && id.length > 0);

  return Array.from(new Set(ids));
}
