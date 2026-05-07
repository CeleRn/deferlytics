import type { AnalyticsAdapter } from "./types";
import type { AnalyticsEvent, Ga4Config } from "../core/types";
import { loadScript } from "../core/scriptLoader";
import { getBrowserWindow } from "../core/utils";

export function createGa4Adapter(config: Ga4Config): AnalyticsAdapter {
  let ready = false;

  return {
    name: "ga4",
    enabled: config.enabled !== false && Boolean(config.measurementId),
    async init() {
      const win = getBrowserWindow();
      if (!win || !config.measurementId) {
        return;
      }

      win.dataLayer = win.dataLayer ?? [];
      win.gtag =
        win.gtag ??
        function gtag(...args: unknown[]) {
          win.dataLayer?.push(args);
        };

      win.gtag("js", new Date());
      win.gtag("config", config.measurementId, {
        send_page_view: config.sendPageView ?? false,
      });

      await loadScript(
        `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
          config.measurementId,
        )}`,
        { id: `deferlytics-ga4-${config.measurementId}` },
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
