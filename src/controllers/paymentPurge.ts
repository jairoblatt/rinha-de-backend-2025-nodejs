import { httpUtils } from "@/shared";
import { databaseClient } from "@/config";
import type { ServerResponse, IncomingMessage } from "http";

export async function paymentPurgeController(_: IncomingMessage, res: ServerResponse) {
  try {
    await databaseClient.deleteAll();
    httpUtils.sendResponse(res, httpUtils.HttpStatus.OK);
  } catch {
    httpUtils.sendResponse(res, httpUtils.HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
