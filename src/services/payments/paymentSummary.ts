import { centsToFloat, floatToCents } from "@/shared";
import { databaseClient } from "@/config";
import { ResourceBodyRead } from "@/database";
import { PaymentProcessor } from "./paymentProcessor";

interface PaymentSummaryResult {
  default: PaymentSummary;
  fallback: PaymentSummary;
}

interface PaymentSummary {
  totalRequests: number;
  totalAmount: number;
}

export async function paymentSummaryService(
  from: string | null,
  to: string | null
): Promise<PaymentSummaryResult> {
  const results = (await databaseClient.getAll()) ?? [];
  const resultsParsed = processSummary(results, from, to);

  return resultsParsed;
}

export function processSummary(
  results: ResourceBodyRead[],
  from: string | null,
  to: string | null
): PaymentSummaryResult {
  const toTimestamp = convertToTimeStamp(to);
  const fromTimestamp = convertToTimeStamp(from);

  const result: PaymentSummaryResult = {
    default: {
      totalRequests: 0,
      totalAmount: 0,
    },
    fallback: {
      totalRequests: 0,
      totalAmount: 0,
    },
  };

  for (const { data } of results) {
    const requestedAtTimestamp = convertToTimeStamp(data.requestedAt);

    if (requestedAtTimestamp === null) {
      continue;
    }

    const isToOutOfRange = toTimestamp !== null && requestedAtTimestamp > toTimestamp;
    const isFromOutOfRange = fromTimestamp !== null && requestedAtTimestamp < fromTimestamp;

    if (isFromOutOfRange || isToOutOfRange) {
      continue;
    }

    const amount = floatToCents(data.amount);

    switch (data.paymentProcessor) {
      case PaymentProcessor.Default:
        result.default.totalRequests += 1;
        result.default.totalAmount += amount;
        break;
      case PaymentProcessor.Fallback:
        result.fallback.totalRequests += 1;
        result.fallback.totalAmount += amount;
        break;
    }
  }

  return {
    default: {
      ...result.default,
      totalAmount: centsToFloat(result.default.totalAmount),
    },
    fallback: {
      ...result.fallback,
      totalAmount: centsToFloat(result.fallback.totalAmount),
    },
  };
}

function convertToTimeStamp(date: string | null): number | null {
  if (!date) {
    return null;
  }

  const timestamp = new Date(date).getTime();
  return isNaN(timestamp) ? null : timestamp;
}
