import type { CheckHealthResponse } from "@/services/payments/paymentProcessor";

export interface AppState {
  ppHealthDefault: CheckHealthResponse;
}

export const appState: AppState = {
  ppHealthDefault: {
    failing: false,
    minResponseTime: 0,
  },
};
