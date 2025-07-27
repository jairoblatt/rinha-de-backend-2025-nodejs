import { httpUtils } from "@/shared";
import { queue } from "../config/index";
import type { QueueMessage } from "../Queue";
import type { ServerResponse, IncomingMessage } from "http";

export function paymentsController(req: IncomingMessage, res: ServerResponse) {
  try {
    httpUtils.readBodyBufferCallback<QueueMessage>(req, (_, body) => {
      body && queue.enqueue(body);
    });

    httpUtils.sendReponse(res, httpUtils.HttpStatus.OK);
  } catch {
    httpUtils.sendReponse(res, httpUtils.HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
