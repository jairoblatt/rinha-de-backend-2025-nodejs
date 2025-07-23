export interface BasicCronJobOptions {
  immediate?: boolean;
  interval: number;
}

export type BasicCronJobHandler = () => Promise<void>;

export function basicCronJob(
  handler: BasicCronJobHandler,
  options: BasicCronJobOptions
) {
  let intervalId: NodeJS.Timeout | null = null;
  let isRunning: boolean = false;

  if (options?.immediate) {
    handlerWrapper();
  }

  intervalId = setInterval(async () => {
    if (isRunning) {
      return;
    }

    await handlerWrapper();
  }, options.interval);

  async function stop(): Promise<void> {
    if (!intervalId) {
      return;
    }

    clearInterval(intervalId);
  }

  async function handlerWrapper(): Promise<void> {
    isRunning = true;
    await handler();
    isRunning = false;
  }

  return stop;
}
