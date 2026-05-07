import type { FastAnalyticsConfig } from "./types";
import { getBrowserWindow } from "./utils";

const BOT_PATTERN =
  /googlebot|yandexbot|bingbot|crawler|spider|bot\b|headlesschrome|playwright|puppeteer/i;

const LIGHTHOUSE_PATTERN = /lighthouse|pagespeed|chrome-lighthouse/i;

export function isBotLike(userAgent = getBrowserWindow()?.navigator?.userAgent ?? ""): boolean {
  const win = getBrowserWindow();
  return BOT_PATTERN.test(userAgent) || Boolean(win?.navigator?.webdriver);
}

export function isLighthouseLike(
  userAgent = getBrowserWindow()?.navigator?.userAgent ?? "",
): boolean {
  return LIGHTHOUSE_PATTERN.test(userAgent);
}

export function shouldSkipAnalytics(config: FastAnalyticsConfig): boolean {
  if (config.skipLighthouse !== false && isLighthouseLike()) {
    return true;
  }

  if (config.skipBots !== false && isBotLike()) {
    return true;
  }

  return false;
}
