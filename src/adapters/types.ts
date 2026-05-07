import type { AnalyticsEvent } from "../core/types";

export interface AnalyticsAdapter {
  name: string;
  enabled: boolean;
  init(): Promise<void>;
  dispatch(event: AnalyticsEvent): void;
  isReady(): boolean;
}
