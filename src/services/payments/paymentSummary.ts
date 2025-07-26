import { RedisPaymentsService } from "@/services/redis";
import { PaymentProcessor } from "./paymentProcessor";

interface PaymentSummary {
  total_requests: number;
  total_amount: number;
}

interface PaymentSummaryResponse {
  default: PaymentSummary;
  fallback: PaymentSummary;
}

export async function paymentSummaryService(from: string | null, to: string | null): Promise<PaymentSummaryResponse> {
  const paymentSummary: PaymentSummaryResponse = {
    default: {
      total_requests: 0,
      total_amount: 0,
    },
    fallback: {
      total_requests: 0,
      total_amount: 0,
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

    summary.total_requests += 1;
    summary.total_amount += item.amount;
  }

  return paymentSummary;
}

function convertToTimeStamp(date: string | null): number | null {
  if (!date) return null;
  const timestamp = new Date(date).getTime();
  return isNaN(timestamp) ? null : timestamp;
}
