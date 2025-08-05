import { httpUtils } from "@/shared";
import { storage } from "@/config";
import { PaymentStorage } from "@/services/storage";
import type { ServerResponse, IncomingMessage } from "http";

export async function paymentPurgeController(_: IncomingMessage, res: ServerResponse) {
  try {
    // await storage.
    // state.default.reset();
    // state.fallback.reset();

    httpUtils.sendReponse(res, httpUtils.HttpStatus.OK);
  } catch {
    httpUtils.sendReponse(res, httpUtils.HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
