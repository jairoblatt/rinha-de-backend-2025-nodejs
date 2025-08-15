import { resolve } from "node:path";
import { Worker } from "node:worker_threads";
import { PaymentProcessor } from "@/services/payments/paymentProcessor";
import { Storage, StorageEntity } from "@/storage";
import { floatToCents } from "@/shared";
import { PaymentDataResponse } from "@/workers/payment";

export interface QueueMessage {
  amount: number;
  correlationId: string;
}

interface QueueOptions {
  workers?: number;
  isFireMotherFucker?: boolean;
}

export class Queue {
  private readonly queue: QueueMessage[] = [];
  private head: number = 0;
  private tail: number = 0;
  private readonly workersFns: ((message: any) => void)[] = [];
  private readonly workersIdle: number[] = [];

  constructor(
    private readonly storageDefault: Storage,
    private readonly storageFallback: Storage,
    readonly queueOptions: QueueOptions
  ) {
    const isFileTs = __filename.endsWith(".ts");
    const workerPath = resolve(
      __dirname,
      isFileTs ? "../workers/payment.ts" : "../workers/payment.js"
    );

    for (let i = 0; i < (queueOptions.workers ?? 1); i++) {
      const worker = new Worker(workerPath, {
        workerData: {
          isFireMotherFucker: queueOptions.isFireMotherFucker,
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

  private setStorageEntry(message: PaymentDataResponse) {
    const entity: StorageEntity = {
      amount: floatToCents(message.amount),
      requestedAt: new Date(message.requestedAt).getTime(),
    };

    switch (message.paymentProcessor) {
      case PaymentProcessor.Default:
        this.storageDefault.push(entity.amount, entity.requestedAt);
        break;
      case PaymentProcessor.Fallback:
        this.storageFallback.push(entity.amount, entity.requestedAt);
        break;
      default:
        throw new Error(`Unknown payment processor: ${message.paymentProcessor}`);
    }
  }

  private hasWorkersIdle(): boolean {
    return this.workersIdle.length > 0;
  }
}
