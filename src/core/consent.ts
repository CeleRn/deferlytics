import type { ConsentConfig, ConsentStatus } from "./types";

export interface ConsentManager {
  getStatus(): ConsentStatus;
  setStatus(status: ConsentStatus): void;
  canLoadVendors(): boolean;
  subscribe(listener: (status: ConsentStatus) => void): () => void;
}

export function createConsentManager(config: ConsentConfig = {}): ConsentManager {
  let status: ConsentStatus = config.defaultStatus ?? "granted";
  const listeners = new Set<(status: ConsentStatus) => void>();

  return {
    getStatus() {
      return status;
    },
    setStatus(nextStatus) {
      status = nextStatus;
      listeners.forEach((listener) => listener(status));
    },
    canLoadVendors() {
      if (status === "denied") {
        return false;
      }

      if (config.required && status !== "granted") {
        return false;
      }

      return status === "granted" || !config.required;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
