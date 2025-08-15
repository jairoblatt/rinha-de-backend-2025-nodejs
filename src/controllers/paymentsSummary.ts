import { httpUtils } from "@/shared";
import { paymentSummaryService } from "@/services";
import type { ServerResponse, IncomingMessage } from "http";

interface PaymentSummaryQuery {
  to: string | null;
  from: string | null;
}

export async function paymentsSummaryController(req: IncomingMessage, res: ServerResponse) {
  try {
    const { to, from } = (httpUtils.readQueryParams(req) || {}) as unknown as PaymentSummaryQuery;

    const result = await paymentSummaryService(from, to);

    httpUtils.sendResponse(res, httpUtils.HttpStatus.OK, result);
  } catch {
    httpUtils.sendResponse(res, httpUtils.HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
