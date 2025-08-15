import { httpUtils, parseSummary, PaymentSummaryQuery, centsToFloat } from "@/shared";
import { storageDefault, storageFallback } from "@/config";
import type { ServerResponse, IncomingMessage } from "http";

export function paymentSummaryInternalController(req: IncomingMessage, res: ServerResponse) {
  try {
    const { to, from } = (httpUtils.readQueryParams(req) || {}) as unknown as PaymentSummaryQuery;

    httpUtils.sendResponse(res, httpUtils.HttpStatus.OK, {
      default: parseSummary(storageDefault, from, to),
      fallback: parseSummary(storageFallback, from, to),
    });
  } catch {
    httpUtils.sendResponse(res, httpUtils.HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
