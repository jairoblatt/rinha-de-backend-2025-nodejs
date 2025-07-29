import { Pool } from "undici";

interface ResponseBase<T> {
  statusCode: number;
  data: T;
}

export interface PaymentData {
  requestedAt: string;
  amount: number;
  correlationId: string;
}

export interface CheckHealthResponse {
  failing: boolean;
  minResponseTime: number;
}

export const enum PaymentProcessor {
  Default = 1,
  Fallback = 2,
}

const pools = {
  [PaymentProcessor.Default]: new Pool("http://payment-processor-default:8080"),
  [PaymentProcessor.Fallback]: new Pool("http://payment-processor-fallback:8080"),
};

async function prewarmPool(pool: Pool) {
  await Promise.all(
    Array.from({ length: 10 }).map(() =>
      pool
        .request({
          path: "/payments/service-health",
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })
        .catch(() => {})
    )
  );
}

prewarmPool(pools[PaymentProcessor.Default]);
prewarmPool(pools[PaymentProcessor.Fallback]);

function paymentProcessorService(paymentProcessor: PaymentProcessor) {
  const defaultHeaders = {
    "Content-Type": "application/json",
  };

  const pool = pools[paymentProcessor];

  const payment = async (data: PaymentData): Promise<ResponseBase<null>> => {
    const { statusCode } = await pool.request({
      path: "/payments",
      method: "POST",
      body: JSON.stringify(data),
      headers: defaultHeaders,
    });

    return {
      statusCode,
      data: null,
    };
  };

  return {
    payment,
  };
}

export const paymentProcessorDefault = paymentProcessorService(PaymentProcessor.Default);
export const paymentProcessorFallback = paymentProcessorService(PaymentProcessor.Fallback);
