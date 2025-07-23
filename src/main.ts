import "@/config/env";
import "@/workers";
import { startHealthChecker } from "@/jobs/health-checker";
import { getSocketPath } from "@/config";
import http from "http";
import fs from "fs";
import { httpUtils } from "@/shared";
import { paymentsController, paymentsSummaryController } from "@/controllers";
import { appState } from "./state";

startHealthChecker({
  appState,
  interval: 5000,
  sourceRedis: true,
});

const SOCKET_PATH = getSocketPath();

if (fs.existsSync(SOCKET_PATH)) {
  fs.unlinkSync(SOCKET_PATH);
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

server.listen(SOCKET_PATH, () => {
  fs.chmodSync(SOCKET_PATH, "666");
  console.log(`Server is listening on ${SOCKET_PATH}`);
});
