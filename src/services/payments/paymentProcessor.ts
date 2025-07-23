import { request } from "undici";

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

function paymentProcessorService(paymentProcessor: PaymentProcessor) {
  const defaultHeaders = {
    "Content-Type": "application/json",
  };

  const baseUrl = {
    [PaymentProcessor.Default]: "http://payment-processor-default:8080",
    [PaymentProcessor.Fallback]: "http://payment-processor-fallback:8080",
  }[paymentProcessor];

  const checkHealth = async (): Promise<ResponseBase<CheckHealthResponse>> => {
    const { body, statusCode } = await request(`${baseUrl}/payments/service-health`, {
      method: "GET",
      headers: defaultHeaders,
    });

    const resp = await body.json();

    return {
      statusCode,
      data: resp as CheckHealthResponse,
    };
  };

  const payment = async (data: PaymentData): Promise<ResponseBase<null>> => {
    const { statusCode } = await request(`${baseUrl}/payments`, {
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
    checkHealth,
  };
}

export const paymentProcessorDefault = paymentProcessorService(PaymentProcessor.Default);
export const paymentProcessorFallback = paymentProcessorService(PaymentProcessor.Fallback);
