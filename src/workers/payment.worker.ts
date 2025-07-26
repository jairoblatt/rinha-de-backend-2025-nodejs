import {
  PaymentProcessor,
  paymentProcessorDefault,
  paymentProcessorFallback,
} from "@/services/payments/paymentProcessor";

interface PaymentJobData {
  amount: number;
  correlationId: string;
}

interface PaymentData {
  requestedAt: string;
  amount: number;
  correlationId: string;
}

function createPaymentData(jobData: PaymentJobData) {
  return {
    amount: jobData.amount,
    requestedAt: new Date().toISOString(),
    correlationId: jobData.correlationId,
  };
}

async function processWithDefault(data: PaymentData) {
  const { statusCode } = await paymentProcessorDefault.payment(data);

  if (statusCode !== 200) {
    throw new Error("Default processor failed");
  }

  return {
    ...data,
    paymentProcessor: PaymentProcessor.Default,
  };
}

async function processWithFallback(data: PaymentData) {
  const { statusCode } = await paymentProcessorFallback.payment(data);

  if (statusCode !== 200) {
    throw new Error("Fallback processor failed");
  }

  return {
    ...data,
    paymentProcessor: PaymentProcessor.Fallback,
  };
}

export async function processPayment(data: any, shouldUseDefault: boolean) {
  const paymentData = createPaymentData(data);

  return shouldUseDefault ? await processWithDefault(paymentData) : await processWithFallback(paymentData);
}
