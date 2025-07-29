import fs from "fs";
import http from "http";
import { httpUtils } from "@/shared";
import {
  paymentsController,
  paymentsSummaryController,
  paymentPurgeController,
} from "@/controllers";

export function startServer(socketPath: string) {
  if (fs.existsSync(socketPath)) {
    fs.unlinkSync(socketPath);
  }

  const server = http.createServer((req, res) => {
    if (req.method === "POST" && req.url === "/payments") {
      paymentsController(req, res);
    } else if (req.method === "GET" && req.url?.startsWith("/payments-summary")) {
      paymentsSummaryController(req, res);
    } else if (req.method === "POST" && req.url === "/purge-payments") {
      paymentPurgeController(req, res);
    } else {
      httpUtils.sendReponse(res, 404);
    }
  });

  server.listen(socketPath, () => {
    fs.chmodSync(socketPath, "666");

    console.log(`Server is listening on ${socketPath}`);
  });
}
