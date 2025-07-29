import { parentPort } from "node:worker_threads";
import { processPayment } from "./workers";

const port = parentPort!;

port.on("message", async ({ payload }) => {
  try {
    const result = await processPayment(payload);

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
