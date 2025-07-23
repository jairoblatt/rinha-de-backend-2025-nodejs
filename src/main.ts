import "@/config/env";
import "@/workers";
import { getSocketPath } from "@/config";
import http from "http";
import fs from "fs";
import { httpUtils } from "@/shared";
import { paymentsController, paymentsSummaryController } from "@/controllers";

// curl --unix-socket /tmp/app.sock http://localhost/

// NOVO PAGAMENTO
// curl http://localhost:9999/payments  -X POST -H "Content-Type: application/json" -d '{"correlationId": "4a7901b8-7d26-4d9d-aa19-4dc1c7cf60b3", "amount": 19.90}'
// curl --unix-socket /tmp/app.sock http://localhost/payments  -X POST -H "Content-Type: application/json" -d '{"correlationId": "4a7901b8-7d26-4d9d-aa19-4dc1c7cf60b3", "amount": 19.90}'

// SUMARIO
// curl http://localhost:9999/payments-summary?to=123\&from=456
// curl --unix-socket /tmp/app.sock http://localhost/payments-summary?to=123\&from=456

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
