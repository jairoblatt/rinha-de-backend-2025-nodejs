import { basicCronJob, type BasicCronJobOptions } from "@/shared";
import { checkAndUpdateDefault, checkAndUpdateRedis } from "@/services/payments/healthCheck";
import type { AppState } from "@/state";

interface StartHealthChecker extends BasicCronJobOptions {
  appState: AppState;
  sourceRedis: boolean;
}

export function startHealthChecker({ appState, sourceRedis, ...cronjobOptions }: StartHealthChecker) {
  return basicCronJob(async () => {
    await healthCheckerHandler({ appState, sourceRedis });
  }, cronjobOptions);
}

export async function healthCheckerHandler({
  appState,
  sourceRedis,
}: Pick<StartHealthChecker, "appState" | "sourceRedis">) {
  sourceRedis ? await checkAndUpdateRedis(appState) : await checkAndUpdateDefault(appState);
}
