import { httpUtils } from "@/shared";
import { storageDefault, storageFallback } from "@/config";
import type { ServerResponse, IncomingMessage } from "http";

export async function paymentPurgeController(_: IncomingMessage, res: ServerResponse) {
  try {
    storageDefault.reset();
    storageFallback.reset();
    httpUtils.sendResponse(res, httpUtils.HttpStatus.OK);
  } catch {
    httpUtils.sendResponse(res, httpUtils.HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
