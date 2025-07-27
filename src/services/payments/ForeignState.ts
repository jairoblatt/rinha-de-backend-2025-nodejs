import undici from "undici";
import { config } from "../../config/env";
import type { PaymentSummaryResponse } from "./paymentSummary";

export async function getForeignState(from: string | null, to: string | null): Promise<PaymentSummaryResponse> {
  try {
    const { body } = await undici.request(`http://nginx:9999/${config.ForeignState}/payments-summary`, {
      query: {
        from,
        to,
        localOnly: "true",
      },
    });

    const data = await body.json();

    return data as PaymentSummaryResponse;
  } catch {
    return {
      default: { totalRequests: 0, totalAmount: 0 },
      fallback: { totalRequests: 0, totalAmount: 0 },
    };
  }
}
