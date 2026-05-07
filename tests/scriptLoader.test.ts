import { describe, expect, it } from "vitest";
import { loadScript } from "../src/core/scriptLoader";

describe("scriptLoader", () => {
  it("resolves when a matching script already exists", async () => {
    const script = document.createElement("script");
    script.id = "existing-script";
    script.src = "https://example.com/vendor.js";
    document.head.appendChild(script);

    await expect(
      loadScript("https://example.com/vendor.js", { id: "existing-script" }),
    ).resolves.toBeUndefined();

    expect(document.querySelectorAll("#existing-script")).toHaveLength(1);
  });
});
