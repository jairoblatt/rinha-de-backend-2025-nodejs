import { resolve } from "node:path";
import { Worker } from "node:worker_threads";
import { RedisPaymentsService } from "@/services/redis";

export interface QueueMessage {
  amount: number;
  correlationId: string;
}

interface QueueOptions {
  workers?: number;
}

export class Queue {
  private readonly queue: QueueMessage[] = [];
  private head: number = 0;
  private tail: number = 0;
  private readonly workersFns: ((message: any) => void)[] = [];
  private readonly workersIdle: number[] = [];

  constructor(readonly queueOptions: QueueOptions) {
    const isFileTs = __filename.endsWith(".ts");
    const workerPath = resolve(__dirname, isFileTs ? "worker.ts" : "worker.js");

    for (let i = 0; i < (queueOptions.workers ?? 1); i++) {
      const worker = new Worker(workerPath);
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

    if (this.head > 1000 && this.head >= this.tail) {
      this.reset();
    }

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

  private startWorker() {
    const message = this.dequeue();
    if (!message) {
      return;
    }

    const workerIndex = this.workersIdle.pop();
    if (workerIndex === undefined) {
      this.queue[--this.head] = message;
      return;
    }

    this.workersFns[workerIndex]({
      payload: message,
    });
  }

  private async onWorkerMessage(workerIndex: number, message: any) {
    const { state, payload } = message;

    switch (state) {
      case "fulfilled":
        await RedisPaymentsService.push(payload);
        break;
      case "rejected":
        this.queue[this.tail++] = payload;
        break;
    }

    this.workersIdle.push(workerIndex);

    if (!this.isEmpty() && this.hasWorkersIdle()) {
      this.startWorker();
    }
  }

  private hasWorkersIdle() {
    return this.workersIdle.length > 0;
  }
}
