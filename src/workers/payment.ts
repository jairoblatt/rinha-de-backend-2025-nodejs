import {
  PaymentProcessor,
  paymentProcessorDefault,
  paymentProcessorFallback,
} from "@/services/payments/paymentProcessor";
import { parentPort, workerData } from "node:worker_threads";

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

let req_count = 0;

const port = parentPort!;

port.on("message", (payload) => {
  processPayment(payload, workerData.isFireMotherFucker, workerData.fallbackInterval)
    .then((result) => {
      if (!result) {
        port.postMessage({
          payload,
          state: "rejected",
        });

        return;
      }

      port.postMessage({
        payload: result,
        state: "fulfilled",
      });
    })
    .catch(() => {
      port.postMessage({
        payload,
        state: "rejected",
      });
    });
});

async function processWithDefault(data: PaymentData) {
  const _data = createPaymentData(data);

  const { statusCode } = await paymentProcessorDefault.payment(_data);

  if (statusCode !== 200) {
    req_count++;

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

function createPaymentData(data: PaymentJobData) {
  return {
    amount: data.amount,
    correlationId: data.correlationId,
    requestedAt: new Date().toISOString(),
  };
}

export async function processPayment(
  data: any,
  isFireMotherFucker: boolean,
  fallbackInterval: number
) {
  try {
    return await processWithDefault(data);
  } catch {
    if (req_count % fallbackInterval === 0 && !isFireMotherFucker) {
      return await processWithFallback(data);
    }
  }
}
