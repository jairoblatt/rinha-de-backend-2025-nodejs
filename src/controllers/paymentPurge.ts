import { httpUtils } from "@/shared";
import state from "@/state";
import type { ServerResponse, IncomingMessage } from "http";

export async function paymentPurgeController(_: IncomingMessage, res: ServerResponse) {
  try {
    state.default.reset();
    state.fallback.reset();

    httpUtils.sendReponse(res, httpUtils.HttpStatus.OK);
  } catch {
    httpUtils.sendReponse(res, httpUtils.HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
