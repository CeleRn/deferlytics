import { describe, expect, it } from "vitest";
import { createConsentManager } from "../src/core/consent";

describe("consent", () => {
  it("allows loading when consent is not required", () => {
    const consent = createConsentManager({ required: false, defaultStatus: "granted" });

    expect(consent.canLoadVendors()).toBe(true);
  });

  it("blocks loading while pending when consent is required", () => {
    const consent = createConsentManager({ required: true, defaultStatus: "pending" });

    expect(consent.canLoadVendors()).toBe(false);
  });

  it("allows loading after grant", () => {
    const consent = createConsentManager({ required: true, defaultStatus: "pending" });
    consent.setStatus("granted");

    expect(consent.canLoadVendors()).toBe(true);
  });
});
