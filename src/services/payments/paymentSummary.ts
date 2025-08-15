import { parseSummary, PaymentSummary, centsToFloat } from "@/shared";
import { Storage } from "@/storage";
import { fetchExternalPaymentSummary } from "@/services/paymentsExternal";

interface PaymentSummaryResponse {
  default: PaymentSummary;
  fallback: PaymentSummary;
}

interface PaymentSummaryService {
  to: string | null;
  from: string | null;
  storageDefault: Storage;
  storageFallback: Storage;
  externalSummaryHostname: string;
}

export async function paymentSummaryService({
  from,
  to,
  storageDefault,
  storageFallback,
  externalSummaryHostname,
}: PaymentSummaryService): Promise<PaymentSummaryResponse> {
  const localDefault = parseSummary(storageDefault, from, to);
  const localFallback = parseSummary(storageFallback, from, to);

  const externalSummary = await fetchExternalPaymentSummary(externalSummaryHostname, from, to);

  const combinedDefault = externalSummary
    ? {
        totalRequests: localDefault.totalRequests + externalSummary.default.totalRequests,
        totalAmount: localDefault.totalAmount + externalSummary.default.totalAmount,
      }
    : localDefault;

  const combinedFallback = externalSummary
    ? {
        totalRequests: localFallback.totalRequests + externalSummary.fallback.totalRequests,
        totalAmount: localFallback.totalAmount + externalSummary.fallback.totalAmount,
      }
    : localFallback;

  return {
    default: {
      totalRequests: combinedDefault.totalRequests,
      totalAmount: centsToFloat(combinedDefault.totalAmount),
    },
    fallback: {
      totalRequests: combinedFallback.totalRequests,
      totalAmount: centsToFloat(combinedFallback.totalAmount),
    },
  };
}
