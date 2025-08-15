import { httpUtils } from "@/shared";
import { paymentSummaryService } from "@/services";
import { storageDefault, storageFallback, config } from "@/config";
import type { ServerResponse, IncomingMessage } from "http";

interface PaymentSummaryQuery {
  to: string | null;
  from: string | null;
}

export async function paymentsSummaryController(req: IncomingMessage, res: ServerResponse) {
  try {
    const { to, from } = (httpUtils.readQueryParams(req) || {}) as unknown as PaymentSummaryQuery;
    const result = await paymentSummaryService({
      from,
      to,
      storageDefault,
      storageFallback,
      externalSummaryHostname: config.ExternalSummaryHostname,
    });

    httpUtils.sendResponse(res, httpUtils.HttpStatus.OK, result);
  } catch {
    httpUtils.sendResponse(res, httpUtils.HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
