import { parentPort } from "node:worker_threads";
import { processPayment } from "./workers";

const port = parentPort!;

port.on("message", async ({ payload, isFireMotherFucker }) => {
  try {
    const result = await processPayment(payload, isFireMotherFucker);

    port.postMessage({
      payload: result ? result : payload,
      state: result ? "fulfilled" : "rejected",
    });
  } catch {
    port.postMessage({
      payload,
      state: "rejected",
    });
  }
});
