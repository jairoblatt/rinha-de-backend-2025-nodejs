import { httpUtils } from "@/shared";
import { databaseClient, queue } from "../config";
import type { QueueMessage } from "@/services";
import type { ServerResponse, IncomingMessage } from "http";

export async function paymentsController(req: IncomingMessage, res: ServerResponse) {
  try {
    const body = await httpUtils.readBody<QueueMessage>(req);

    if ((body?.amount ?? 0) < 0 || !body?.correlationId) {
      httpUtils.sendResponse(res, httpUtils.HttpStatus.NOT_FOUND);
      return;
    }

    const data = await databaseClient.get(body.correlationId);

    if (data) {
      httpUtils.sendResponse(res, httpUtils.HttpStatus.CONFLICT);
      return;
    }

    queue.enqueue(body);

    httpUtils.sendResponse(res, httpUtils.HttpStatus.OK);
  } catch {
    httpUtils.sendResponse(res, httpUtils.HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
