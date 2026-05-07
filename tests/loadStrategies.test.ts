import { describe, expect, it, vi } from "vitest";
import { scheduleLoad } from "../src/core/loadStrategies";

describe("loadStrategies", () => {
  it("runs immediate strategy once", () => {
    vi.useFakeTimers();
    const callback = vi.fn();

    scheduleLoad("immediate", callback);
    vi.runAllTimers();

    expect(callback).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("does not run manual strategy", () => {
    vi.useFakeTimers();
    const callback = vi.fn();

    scheduleLoad("manual", callback);
    vi.runAllTimers();

    expect(callback).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("runs interaction strategy once", () => {
    const callback = vi.fn();

    scheduleLoad("interaction", callback);
    window.dispatchEvent(new Event("click"));
    window.dispatchEvent(new Event("click"));

    expect(callback).toHaveBeenCalledTimes(1);
  });
});
