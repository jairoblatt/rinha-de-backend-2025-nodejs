import { resolve } from "node:path";
import { Worker } from "node:worker_threads";
import { RedisPaymentsService } from "@/services/redis";
import { healthCheckerHandler } from "./jobs";
import type { AppState } from "./state";

export interface QueueMessage {
  amount: number;
  correlationId: string;
}

interface QueueOptions {
  concurency?: number;
  appState: AppState;
  sourceRedis: boolean;
}

export class Queue {
  private readonly queue: QueueMessage[] = [];
  private readonly workers: ((message: any) => void)[] = [];
  private readonly workersIddle: number[] = [];

  constructor(readonly queueOptions: QueueOptions) {
    const workerPath = resolve(__dirname, __filename.endsWith(".ts") ? "worker.ts" : "worker.js");
    console.log("Total Workers:", queueOptions.concurency);

    for (let i = 0; i < (queueOptions.concurency ?? 1); i++) {
      const worker = new Worker(workerPath);

      this.workersIddle.push(i);

      this.workers.push((message) => worker.postMessage(message));

      worker.on("message", async ({ state, payload }) => {
        switch (state) {
          case "fulfilled":
            {
              await RedisPaymentsService.push(payload);
              this.workersIddle.push(i);
            }
            break;

          case "rejected":
            await healthCheckerHandler({
              appState: this.queueOptions.appState,
              sourceRedis: this.queueOptions.sourceRedis,
            });
            this.queue.push(payload);
            break;
        }

        if (!this.queue.length) {
          return;
        }

        this.startWorkers();
      });
    }
  }

  public push(message: QueueMessage) {
    this.queue.push(message);

    if (!this.hasWorkersIddle()) {
      return;
    }

    this.startWorkers();
  }

  private startWorkers() {
    const message = this.queue.shift();

    if (!message) {
      return;
    }

    const workerIndex = this.workersIddle.pop();

    if (workerIndex === undefined) {
      return;
    }

    const shouldUseDefault = this.shouldUseDefault();

    this.workers[workerIndex]({
      payload: message,
      shouldUseDefault,
    });
  }

  private hasWorkersIddle() {
    return Boolean(this.workersIddle.length);
  }

  private shouldUseDefault(): boolean {
    return (
      !this.queueOptions.appState.ppHealthDefault.failing &&
      this.queueOptions.appState.ppHealthDefault.minResponseTime < 500
    );
  }
}
