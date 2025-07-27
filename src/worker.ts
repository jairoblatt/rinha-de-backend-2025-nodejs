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

port.on("message", async ({ payload }) => {
  try {
    const result = await paymentCircuitBreaker.execute(payload);

    port.postMessage({
      payload: result,
      state: "fulfilled",
    });
  } catch (error) {
    port.postMessage({
      payload,
      state: "rejected",
    });
  }
});
