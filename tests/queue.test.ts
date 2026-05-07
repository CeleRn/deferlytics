import { describe, expect, it } from "vitest";
import { createQueue } from "../src/core/queue";
import type { AnalyticsEvent } from "../src/core/types";

describe("queue", () => {
  it("preserves order and drains events", () => {
    const queue = createQueue({ maxSize: 10 });
    queue.enqueue(event("1"));
    queue.enqueue(event("2"));

    expect(queue.drain().map((item) => item.id)).toEqual(["1", "2"]);
    expect(queue.size()).toBe(0);
  });

  it("drops oldest events when max size is exceeded", () => {
    const queue = createQueue({ maxSize: 2 });
    queue.enqueue(event("1"));
    queue.enqueue(event("2"));
    queue.enqueue(event("3"));

    expect(queue.peek().map((item) => item.id)).toEqual(["2", "3"]);
  });

  it("flushes events", () => {
    const queue = createQueue();
    queue.enqueue(event("1"));
    queue.flush();

    expect(queue.size()).toBe(0);
  });
});

function event(id: string): AnalyticsEvent {
  return {
    id,
    type: "event",
    name: "test",
    timestamp: 1,
    relativeTime: 1,
    url: "https://example.com",
    path: "/",
    title: "Example",
    referrer: "",
    userAgent: "test",
  };
}
