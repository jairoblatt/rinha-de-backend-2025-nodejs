import { httpUtils } from "@/shared";
import { addPaymentJob } from "@/producers/payment.producer";
import type { ServerResponse, IncomingMessage } from "http";

interface PaymentBody {
  correlationId: string;
  amount: number;
}

export async function paymentsController(req: IncomingMessage, res: ServerResponse) {
  try {
    const body = await httpUtils.readBody<PaymentBody>(req);
    await addPaymentJob(body);
    httpUtils.sendReponse(res, httpUtils.HttpStatus.OK);
  } catch {
    httpUtils.sendReponse(res, httpUtils.HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
