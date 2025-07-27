import { httpUtils } from "@/shared";
import { paymentSummaryService } from "@/services";
import type { ServerResponse, IncomingMessage } from "http";

interface PaymentSummaryQuery {
  to: string | null;
  from: string | null;
  localOnly: string;
}

export async function paymentsSummaryController(req: IncomingMessage, res: ServerResponse) {
  try {
    const {
      to = null,
      from = null,
      localOnly = "false",
    } = (httpUtils.readQueryParams(req) || {}) as unknown as PaymentSummaryQuery;

    const result = await paymentSummaryService(from, to, localOnly === "true");

    httpUtils.sendReponse(res, httpUtils.HttpStatus.OK, result);
  } catch {
    httpUtils.sendReponse(res, httpUtils.HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
