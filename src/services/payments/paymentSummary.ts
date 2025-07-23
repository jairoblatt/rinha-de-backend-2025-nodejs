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

  const fromTimestamp = convertToTimeStamp(from!);
  const toTimestamp = convertToTimeStamp(to!);

  const shouldFilterByDate = fromTimestamp && toTimestamp;

  for (const item of data) {
    if (!shouldFilterByDate) {
      continue;
    }

    const requestedAtTimestamp = convertToTimeStamp(item.requestedAt);

    if (!requestedAtTimestamp) {
      continue;
    }

    if (requestedAtTimestamp < fromTimestamp || requestedAtTimestamp > toTimestamp) {
      continue;
    }

    if (item.paymentProcessor === PaymentProcessor.Default) {
      paymentSummary.default.total_requests += 1;
      paymentSummary.default.total_amount += item.amount;
      continue;
    }

    paymentSummary.fallback.total_requests += 1;
    paymentSummary.fallback.total_amount += item.amount;
  }

  return paymentSummary;
}

function convertToTimeStamp(date: string): number | null {
  try {
    const _date = new Date(date);
    return _date.getTime();
  } catch {
    return null;
  }
}
