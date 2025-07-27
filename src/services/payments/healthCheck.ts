import { paymentProcessorDefault } from "./paymentProcessor";
import { RedisHealthCheckService } from "@/services/redis";
import type { AppState } from "@/state";
import type { CheckHealthResponse } from "@/services/payments/paymentProcessor";

const DEFAULT_HEALTH_VALUES = {
  FAILING: true,
  MIN_RESPONSE_TIME: 9999,
} as const;

function updateHealthCheckState(appState: AppState, healthData: CheckHealthResponse): void {
  appState.ppHealthDefault.failing = healthData.failing;
  appState.ppHealthDefault.minResponseTime = healthData.minResponseTime;
}

export async function updateFalling(appState: AppState, status: CheckHealthResponse) {
  updateHealthCheckState(appState, status);
}

export async function checkAndUpdateDefault(appState: AppState): Promise<void> {
  const result = await paymentProcessorDefault.checkHealth();
  const isSuccess = result.statusCode === 200;

  const healthData = isSuccess
    ? result.data
    : {
        failing: DEFAULT_HEALTH_VALUES.FAILING,
        minResponseTime: DEFAULT_HEALTH_VALUES.MIN_RESPONSE_TIME,
      };

  updateHealthCheckState(appState, healthData);

  await RedisHealthCheckService.set(healthData);
}

export async function checkAndUpdateRedis(appState: AppState): Promise<void> {
  try {
    const resultStr = await RedisHealthCheckService.get();

    updateHealthCheckState(appState, {
      failing: resultStr.failing,
      minResponseTime: resultStr.minResponseTime,
    });
  } catch {
    updateHealthCheckState(appState, {
      failing: DEFAULT_HEALTH_VALUES.FAILING,
      minResponseTime: DEFAULT_HEALTH_VALUES.MIN_RESPONSE_TIME,
    });
  }
}
