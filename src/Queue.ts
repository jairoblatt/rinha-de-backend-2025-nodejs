import { resolve } from "node:path";
import { Worker } from "node:worker_threads";
import { PaymentProcessor } from "@/services/payments/paymentProcessor";
import { floatToCents } from "@/shared";
import { Storage, PaymentStorage } from "@/services";
import type { PaymentDataResponse } from "./workers/payment.worker";

export interface QueueMessage {
  amount: number;
  correlationId: string;
}

interface QueueOptions {
  workers?: number;
  isFireMotherFucker?: boolean;
}

interface WorkerMessage {
  state: "fulfilled" | "rejected";
  payload: PaymentDataResponse | QueueMessage;
}

export class Queue {
  private readonly queue: QueueMessage[] = [];
  private head: number = 0;
  private tail: number = 0;
  private readonly workersFns: ((message: any) => void)[] = [];
  private readonly workersIdle: number[] = [];

  constructor(private readonly storage: Storage, readonly queueOptions: QueueOptions) {
    const isFileTs = __filename.endsWith(".ts");
    const workerPath = resolve(__dirname, isFileTs ? "workers/payment.ts" : "workers/payment.js");

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

  private reset() {
    this.queue.length = 0;
    this.head = 0;
    this.tail = 0;
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

  private async onWorkerMessage(workerIndex: number, message: any) {
    const { state, payload } = message;

    switch (state) {
      case "fulfilled":
        await this.setResultState(payload);
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

  private async setResultState(message: PaymentDataResponse) {
    const entry = {
      amount: floatToCents(message.amount),
      requestedAt: new Date(message.requestedAt).getTime(),
    };

    switch (message.paymentProcessor) {
      case PaymentProcessor.Default:
        await this.storage.push(PaymentStorage.Default, entry);
        break;
      case PaymentProcessor.Fallback:
        await this.storage.push(PaymentStorage.Fallback, entry);
        break;
    }
  }

  private hasWorkersIdle(): boolean {
    return this.workersIdle.length > 0;
  }
}
