import type { AnalyticsEvent } from "./types";

export interface AnalyticsQueue {
  enqueue(event: AnalyticsEvent): void;
  drain(): AnalyticsEvent[];
  flush(): void;
  peek(): AnalyticsEvent[];
  size(): number;
  setMaxSize(size: number): void;
}

export interface QueueOptions {
  events?: AnalyticsEvent[];
  maxSize?: number;
  onDrop?: (event: AnalyticsEvent) => void;
}

export function createQueue(options: QueueOptions = {}): AnalyticsQueue {
  const events = options.events ?? [];
  let maxSize = normalizeMaxSize(options.maxSize);

  function trim(): void {
    while (events.length > maxSize) {
      const dropped = events.shift();
      if (dropped) {
        options.onDrop?.(dropped);
      }
    }
  }

  trim();

  return {
    enqueue(event) {
      events.push(event);
      trim();
    },
    drain() {
      const drained = events.slice();
      events.length = 0;
      return drained;
    },
    flush() {
      events.length = 0;
    },
    peek() {
      return events.slice();
    },
    size() {
      return events.length;
    },
    setMaxSize(size) {
      maxSize = normalizeMaxSize(size);
      trim();
    },
  };
}

function normalizeMaxSize(size = 100): number {
  if (!Number.isFinite(size) || size <= 0) {
    return 100;
  }

  return Math.floor(size);
}
