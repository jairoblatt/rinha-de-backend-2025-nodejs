import { parentPort } from "node:worker_threads";
import { paymentCircuitBreaker } from "./workers";

const responses = [
  {
    state: "fulfilled",
    payload: null,
  },
  {
    state: "rejected",
    payload: null,
  },
];
const port = parentPort!;

port.on("message", ({ payload }) => {
  paymentCircuitBreaker
    .execute(payload)
    .then((result) => {
      responses[0].payload = result;
      port.postMessage(responses[0]);
      responses[0].payload = null;
    })
    .catch(() => {
      responses[1].payload = payload;
      port.postMessage(responses[1]);
      responses[1].payload = null;
    });
});
