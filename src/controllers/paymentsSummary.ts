import { httpUtils } from "@/shared";
import type { ServerResponse, IncomingMessage } from "http";

interface PaymentBody {
  correlationId: string;
  amount: number;
}

export async function paymentsSummaryController(
  req: IncomingMessage,
  res: ServerResponse
) {
  try {
    const query = httpUtils.readQueryParams(req);

    console.log(query);

    httpUtils.sendReponse(res, httpUtils.HttpStatus.OK);
  } catch {
    console.log("Error processing request");
    httpUtils.sendReponse(res, httpUtils.HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
