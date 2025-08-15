import { httpGet } from "./client";
import { PaymentSummary } from "@/shared";

interface ExternalSummaryResponse {
  default: PaymentSummary;
  fallback: PaymentSummary;
}

export async function fetchExternalPaymentSummary(
  hostname: string,
  from: string | null,
  to: string | null
): Promise<ExternalSummaryResponse | null> {
  if (!hostname) {
    return null;
  }

  try {
    const queryParams = new URLSearchParams();

    if (from) {
      queryParams.set("from", from);
    }

    if (to) {
      queryParams.set("to", to);
    }

    const queryParamsStr = queryParams.toString();

    return await httpGet<ExternalSummaryResponse>({
      hostname,
      path: `/internal-payments-summary${queryParamsStr ? `?${queryParamsStr}` : ""}`,
    });
  } catch {
    return null;
  }
}
