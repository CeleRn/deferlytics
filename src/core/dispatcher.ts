import type { AnalyticsAdapter } from "../adapters/types";
import type { AnalyticsEvent } from "./types";
import { debugLog } from "./utils";

export interface DispatcherOptions {
  debug?: boolean;
}

export class Dispatcher {
  private readonly adapters: AnalyticsAdapter[];
  private readonly seenEventIds = new Set<string>();
  private readonly debug?: boolean;

  constructor(adapters: AnalyticsAdapter[], options: DispatcherOptions = {}) {
    this.adapters = adapters.filter((adapter) => adapter.enabled);
    this.debug = options.debug;
  }

  async init(): Promise<void> {
    await Promise.allSettled(
      this.adapters.map(async (adapter) => {
        try {
          await adapter.init();
          debugLog(this.debug, `${adapter.name} adapter ready`);
        } catch (error) {
          debugLog(this.debug, `${adapter.name} adapter failed`, error);
        }
      }),
    );
  }

  dispatch(event: AnalyticsEvent): void {
    if (this.seenEventIds.has(event.id)) {
      return;
    }

    this.seenEventIds.add(event.id);

    for (const adapter of this.adapters) {
      if (!adapter.isReady()) {
        continue;
      }

      try {
        adapter.dispatch(event);
      } catch (error) {
        debugLog(this.debug, `${adapter.name} dispatch failed`, error);
      }
    }
  }

  replay(events: AnalyticsEvent[]): void {
    for (const event of events) {
      this.dispatch(event);
    }
  }

  hasReadyAdapter(): boolean {
    return this.adapters.some((adapter) => adapter.isReady());
  }
}
