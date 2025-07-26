import { parentPort } from "node:worker_threads";
import { processPayment } from "./workers";

if (parentPort) {
  parentPort.on("message", async ({ payload, shouldUseDefault }) => {
    try {
      const result = await processPayment(payload, shouldUseDefault);

      parentPort?.postMessage({
        payload: result,
        state: "fulfilled",
      });
    } catch (error) {
      parentPort?.postMessage({
        payload,
        state: "rejected",
      });
    }
  });
}
