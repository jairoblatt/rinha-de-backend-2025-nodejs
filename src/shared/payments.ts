import { Storage, StorageEntity } from "@/storage";

export interface PaymentSummary {
  totalRequests: number;
  totalAmount: number;
}

export interface PaymentSummaryQuery {
  to: string | null;
  from: string | null;
}

export function parseSummary(
  storage: Storage,
  from: string | null,
  to: string | null
): PaymentSummary {
  const items = storage.list();

  const toTimestamp = convertToTimeStamp(to);
  const fromTimestamp = convertToTimeStamp(from);

  return processState(items, fromTimestamp, toTimestamp)
}

function convertToTimeStamp(date: string | null): number | null {
  if (!date) {
    return null;
  }

  const timestamp = new Date(date).getTime();
  return isNaN(timestamp) ? null : timestamp;
}

function processState(
  data: StorageEntity[],
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
