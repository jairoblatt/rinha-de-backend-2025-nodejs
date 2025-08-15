import { httpUtils } from "@/shared";
import { queue } from "../config/index";
import type { QueueMessage } from "@/services";
import type { ServerResponse, IncomingMessage } from "http";

export function paymentsController(req: IncomingMessage, res: ServerResponse) {
  try {
    httpUtils.readBody<QueueMessage>(req).then((body) => {
      if ((body?.amount ?? 0) < 0 || !body?.correlationId) {
        return;
      }

      queue.enqueue(body);
    });

    httpUtils.sendResponse(res, httpUtils.HttpStatus.OK);
  } catch {
    httpUtils.sendResponse(res, httpUtils.HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
