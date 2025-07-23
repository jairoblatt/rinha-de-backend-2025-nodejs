import fs from "fs";
import http from "http";
import { httpUtils } from "@/shared";
import { paymentsController, paymentsSummaryController } from "@/controllers";

export function startServer(socketPath: string) {
  if (fs.existsSync(socketPath)) {
    fs.unlinkSync(socketPath);
  }

  const server = http.createServer(async (req, res) => {
    console.log(`Received request: ${req.method} ${req.url}`);

    if (req.method === "POST" && req.url === "/payments") {
      await paymentsController(req, res);
    } else if (req.method === "GET" && req.url?.startsWith("/payments-summary")) {
      await paymentsSummaryController(req, res);
    } else {
      httpUtils.sendReponse(res, 404);
    }
  });

  server.listen(socketPath, () => {
    fs.chmodSync(socketPath, "666");

    console.log(`Server is listening on ${socketPath}`);
  });
}
