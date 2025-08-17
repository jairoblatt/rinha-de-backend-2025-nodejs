import { resolve } from "node:path";
import { Worker } from "node:worker_threads";
import { PaymentDataResponse } from "@/workers/payment";
import { databaseClient } from "@/config";

export interface QueueMessage {
  amount: number;
  correlationId: string;
}

interface QueueOptions {
  workers?: number;
  isFireMotherFucker?: boolean;
  fallbackInterval: number;
}

export class Queue {
  private readonly queue: QueueMessage[] = [];
  private head: number = 0;
  private tail: number = 0;
  private readonly workersFns: ((message: any) => void)[] = [];
  private readonly workersIdle: number[] = [];

  constructor(readonly queueOptions: QueueOptions) {
    const isFileTs = __filename.endsWith(".ts");
    const workerPath = resolve(
      __dirname,
      isFileTs ? "../../dist/workers/payment.js" : "../workers/payment.js"
    );

    for (let i = 0; i < (queueOptions.workers ?? 1); i++) {
      const worker = new Worker(workerPath, {
        workerData: {
          isFireMotherFucker: queueOptions.isFireMotherFucker,
          fallbackInterval: queueOptions.fallbackInterval,
        },
      });
      this.workersIdle.push(i);
      this.workersFns.push((message) => worker.postMessage(message));

      worker.on("message", (message) => this.onWorkerMessage(i, message));
    }
  }

  public enqueue(message: QueueMessage) {
    this.queue[this.tail++] = message;

    if (this.hasWorkersIdle()) {
      this.startWorker();
    }
  }

  private dequeue(): QueueMessage | undefined {
    if (this.isEmpty()) {
      return undefined;
    }

    const message = this.queue[this.head];
    delete this.queue[this.head];
    this.head++;

    return message;
  }

  private isEmpty(): boolean {
    return this.head >= this.tail;
  }

  private startWorker(): void {
    const message = this.dequeue();
    if (!message) {
      return;
    }

    const workerIndex = this.workersIdle.pop();
    if (workerIndex === undefined) {
      this.queue[--this.head] = message;
      return;
    }

    this.workersFns[workerIndex](message);
  }

  private onWorkerMessage(workerIndex: number, message: any) {
    const { state, payload } = message;

    switch (state) {
      case "fulfilled":
        this.setStorageEntry(payload);
        break;
      case "rejected":
        this.queue[this.tail++] = payload as QueueMessage;
        break;
    }

    this.workersIdle.push(workerIndex);

    if (!this.isEmpty() && this.hasWorkersIdle()) {
      this.startWorker();
    }
  }

  private async setStorageEntry(message: PaymentDataResponse) {
    await databaseClient.set(message.correlationId, {
      amount: message.amount,
      requestedAt: message.requestedAt,
      paymentProcessor: message.paymentProcessor,
    });
  }

  private hasWorkersIdle(): boolean {
    return this.workersIdle.length > 0;
  }
}
