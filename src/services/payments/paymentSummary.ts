import { centsToFloat } from "@/shared";
import { PaymentStorage, Storage, StorageEntry } from "@/services/storage";

interface PaymentSummary {
  totalRequests: number;
  totalAmount: number;
}

export interface PaymentSummaryResponse {
  default: PaymentSummary;
  fallback: PaymentSummary;
}

export async function paymentSummaryService(
  from: string | null,
  to: string | null,
  storage: Storage
): Promise<PaymentSummaryResponse> {
  const stateDefault = await storage.list(PaymentStorage.Default);
  const stateFallback = await storage.list(PaymentStorage.Fallback);

  const toTimestamp = convertToTimeStamp(to);
  const fromTimestamp = convertToTimeStamp(from);

  const paymentSummary: PaymentSummaryResponse = {
    default: processState(stateDefault, fromTimestamp, toTimestamp),
    fallback: processState(stateFallback, fromTimestamp, toTimestamp),
  };

  return {
    default: {
      totalRequests: paymentSummary.default.totalRequests,
      totalAmount: centsToFloat(paymentSummary.default.totalAmount),
    },
    fallback: {
      totalRequests: paymentSummary.fallback.totalRequests,
      totalAmount: centsToFloat(paymentSummary.fallback.totalAmount),
    },
  };
}

function convertToTimeStamp(date: string | null): number | null {
  if (!date) return null;
  const timestamp = new Date(date).getTime();
  return isNaN(timestamp) ? null : timestamp;
}

function processState(
  data: StorageEntry[],
  fromTimestamp: number | null,
  toTimestamp: number | null
): PaymentSummary {
  const summary: PaymentSummary = {
    totalRequests: 0,
    totalAmount: 0,
  };

  for (const item of data) {
    if (item.requestedAt === null) {
      continue;
    }

    const isOutOfRange =
      (fromTimestamp !== null && item.requestedAt < fromTimestamp) ||
      (toTimestamp !== null && item.requestedAt > toTimestamp);

    if (isOutOfRange) {
      continue;
    }

    summary.totalRequests += 1;
    summary.totalAmount += item.amount;
  }

  return summary;
}
