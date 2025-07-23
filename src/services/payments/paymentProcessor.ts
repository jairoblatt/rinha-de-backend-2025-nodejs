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

function paymentProcessorService(baseUrl: string) {
  const defaultHeaders = {
    "Content-Type": "application/json",
  };

  const checkHealth = async (): Promise<ResponseBase<CheckHealthResponse>> => {
    const { body, statusCode } = await request(
      `${baseUrl}/payments/service-health`,
      {
        method: "GET",
        headers: defaultHeaders,
      }
    );

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

export const paymentProcessorDefault = paymentProcessorService(
  "http://payment-processor-default:8080"
);

export const paymentProcessorFallback = paymentProcessorService(
  "http://payment-processor-fallback:8080"
);
