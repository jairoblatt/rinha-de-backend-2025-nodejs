import fs from "fs";
import http from "http";
import { httpUtils, createSocketPath } from "@/shared";
import {
  paymentsController,
  paymentPurgeController,
  paymentsSummaryController,
} from "@/controllers";

export function startServer(hostname: string) {
  const socketPath = createSocketPath(hostname);

  if (fs.existsSync(socketPath)) {
    fs.unlinkSync(socketPath);
  }

  const server = http.createServer((req, res) => {
    const { method, url } = req;

    if (method === "POST" && url === "/payments") {
      paymentsController(req, res);
    } else if (method === "GET" && url?.includes("/payments-summary")) {
      paymentsSummaryController(req, res);
    } else if (method === "POST" && url === "/purge-payments") {
      paymentPurgeController(req, res);
    } else {
      httpUtils.sendResponse(res, httpUtils.HttpStatus.NOT_FOUND);
    }
  });

  server.listen(socketPath, () => {
    fs.chmodSync(socketPath, "666");

    console.log(`Server is listening on ${socketPath}`);
  });
}
