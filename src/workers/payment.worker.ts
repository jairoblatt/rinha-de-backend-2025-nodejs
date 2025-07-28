import {
  PaymentProcessor,
  paymentProcessorDefault,
  paymentProcessorFallback,
} from "@/services/payments/paymentProcessor";
import { AdaptiveCircuitBreaker } from "@/adaptiveCircuitBreaker";

interface PaymentJobData {
  amount: number;
  correlationId: string;
}

export interface PaymentData {
  requestedAt: string;
  amount: number;
  correlationId: string;
}

export interface PaymentDataResponse extends PaymentData {
  paymentProcessor: PaymentProcessor;
}

function createPaymentData(jobData: PaymentJobData) {
  return {
    amount: jobData.amount,
    requestedAt: new Date().toISOString(),
    correlationId: jobData.correlationId,
  };
}

async function processWithDefault(data: PaymentData) {
  const _data = createPaymentData(data);
  const { statusCode } = await paymentProcessorDefault.payment(_data);

  if (statusCode !== 200) {
    throw new Error("Default processor failed");
  }

  return {
    ..._data,
    paymentProcessor: PaymentProcessor.Default,
  };
}

async function processWithFallback(data: PaymentData) {
  const _data = createPaymentData(data);
  const { statusCode } = await paymentProcessorFallback.payment(_data);

  if (statusCode !== 200) {
    throw new Error("Fallback processor failed");
  }

  return {
    ..._data,
    paymentProcessor: PaymentProcessor.Fallback,
  };
}

export async function processPayment(data: any, shouldUseDefault: boolean) {
  const paymentData = createPaymentData(data);

  return await processWithDefault(paymentData);
  // try {
  //   const result = await processWithDefault(paymentData)
  //   return result;
  // } catch {

  // }

  // return shouldUseDefault ?  : await processWithFallback(paymentData);
}

export const paymentCircuitBreaker = new AdaptiveCircuitBreaker(
  processWithDefault,
  processWithFallback,
  {
    adaptiveThreshold: 0.6,
  }
);
