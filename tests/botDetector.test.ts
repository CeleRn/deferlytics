import { describe, expect, it } from "vitest";
import { isBotLike, isLighthouseLike } from "../src/core/botDetector";

describe("botDetector", () => {
  it("detects common bots", () => {
    expect(isBotLike("Mozilla/5.0 Googlebot/2.1")).toBe(true);
    expect(isBotLike("Mozilla/5.0 YandexBot/3.0")).toBe(true);
    expect(isBotLike("Bingbot/2.0")).toBe(true);
  });

  it("detects lighthouse", () => {
    expect(isLighthouseLike("Chrome-Lighthouse")).toBe(true);
    expect(isLighthouseLike("PageSpeed Insights")).toBe(true);
  });

  it("does not flag a normal browser user agent", () => {
    expect(
      isBotLike(
        "Mozilla/5.0 AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
      ),
    ).toBe(false);
  });
});
