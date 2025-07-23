import { basicCronJob, type BasicCronJobOptions } from "@/shared/cron-job";
import {
  checkAndUpdateDefault,
  checkAndUpdateRedis,
} from "@/services/payments/healthCheck";
import type { AppState } from "@/state";

interface StartHealthChecker extends BasicCronJobOptions {
  appState: AppState;
  sourceRedis: boolean;
}

export function startHealthChecker({
  appState,
  sourceRedis,
  ...cronjobOptions
}: StartHealthChecker) {
  return basicCronJob(async () => {
    sourceRedis
      ? checkAndUpdateRedis(appState)
      : checkAndUpdateDefault(appState);
  }, cronjobOptions);
}
