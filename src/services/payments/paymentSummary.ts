import { RedisPaymentsService } from "@/services/redis";
import { PaymentProcessor } from "./paymentProcessor";

interface PaymentSummary {
  totalRequests: number;
  totalAmount: number;
}

interface PaymentSummaryResponse {
  default: PaymentSummary;
  fallback: PaymentSummary;
}

export async function paymentSummaryService(from: string | null, to: string | null): Promise<PaymentSummaryResponse> {
  const paymentSummary: PaymentSummaryResponse = {
    default: {
      totalRequests: 0,
      totalAmount: 0,
    },
    fallback: {
      totalRequests: 0,
      totalAmount: 0,
    },
  };

  const data = await RedisPaymentsService.list();

  const fromTimestamp = convertToTimeStamp(from);
  const toTimestamp = convertToTimeStamp(to);

  for (const item of data) {
    const requestedAtTimestamp = convertToTimeStamp(item.requestedAt);
    if (requestedAtTimestamp === null) continue;

    const isOutOfRange =
      (fromTimestamp !== null && requestedAtTimestamp < fromTimestamp) ||
      (toTimestamp !== null && requestedAtTimestamp > toTimestamp);

    if (isOutOfRange) continue;

    const summary =
      item.paymentProcessor === PaymentProcessor.Default ? paymentSummary.default : paymentSummary.fallback;

    summary.totalRequests += 1;
    summary.totalAmount += item.amount;
  }

  return paymentSummary;
}

function convertToTimeStamp(date: string | null): number | null {
  if (!date) return null;
  const timestamp = new Date(date).getTime();
  return isNaN(timestamp) ? null : timestamp;
}
