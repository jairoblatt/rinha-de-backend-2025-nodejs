import { centsToFloat, floatToCents } from "@/shared";
import state, { type StorageEntry } from "@/state";
import { getForeignState } from "./ForeignState";

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
  localOnly: boolean
): Promise<PaymentSummaryResponse> {
  const stateDefault = state.default.list();
  const stateFallback = state.fallback.list();

  const toTimestamp = convertToTimeStamp(to);
  const fromTimestamp = convertToTimeStamp(from);

  const paymentSummary: PaymentSummaryResponse = {
    default: processState(stateDefault, fromTimestamp, toTimestamp),
    fallback: processState(stateFallback, fromTimestamp, toTimestamp),
  };

  if (!localOnly) {
    const foreignState = await getForeignState(from, to);
    paymentSummary.default.totalAmount += floatToCents(foreignState.default.totalAmount);
    paymentSummary.default.totalRequests += foreignState.default.totalRequests;

    paymentSummary.fallback.totalAmount += floatToCents(foreignState.fallback.totalAmount);
    paymentSummary.fallback.totalRequests += foreignState.fallback.totalRequests;
  }

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
