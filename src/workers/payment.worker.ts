import { Worker } from "bullmq";
import { redisConfig } from "../config/redis";

export const processPaymentWorker = new Worker(
  "payment",
  async (job) => {
    console.log(`Processando pagamento para:`, job.data);
    await new Promise((resolve) => setTimeout(resolve, 5_000));
    console.log(`Pagamento processado:`, job.data);
  },
  { connection: redisConfig }
);
