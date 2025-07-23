import { Worker, type Job } from "bullmq";
import { redisConfig } from "../config/redis";
import {
  PaymentProcessor,
  paymentProcessorDefault,
  paymentProcessorFallback,
} from "@/services/payments/paymentProcessor";
import { RedisPaymentsService } from "@/services/redis";
import { appState } from "../state";

interface PaymentJobData {
  amount: number;
  correlationId: string;
}

interface PaymentData {
  requestedAt: string;
  amount: number;
  correlationId: string;
}

export const processPaymentWorker = new Worker("payment", processPayment, {
  connection: redisConfig,
  concurrency: 4,
});

function createPaymentData(jobData: PaymentJobData) {
  return {
    amount: jobData.amount,
    requestedAt: new Date().toISOString(),
    correlationId: jobData.correlationId,
  };
}

function shouldUseDefault(): boolean {
  return !appState.ppHealthDefault.failing && appState.ppHealthDefault.minResponseTime < 500;
}

async function processWithDefault(data: PaymentData): Promise<void> {
  const { statusCode } = await paymentProcessorDefault.payment(data);

  if (statusCode !== 200) {
    throw new Error("Default processor failed");
  }

  await RedisPaymentsService.push({
    ...data,
    paymentProcessor: PaymentProcessor.Default,
  });
}

async function processWithFallback(data: PaymentData): Promise<void> {
  const { statusCode } = await paymentProcessorFallback.payment(data);

  if (statusCode !== 200) {
    throw new Error("Fallback processor failed");
  }

  await RedisPaymentsService.push({
    ...data,
    paymentProcessor: PaymentProcessor.Fallback,
  });
}

async function processPayment(job: Job<PaymentJobData>): Promise<void> {
  const paymentData = createPaymentData(job.data);

  shouldUseDefault() ? await processWithDefault(paymentData) : await processWithFallback(paymentData);
}
