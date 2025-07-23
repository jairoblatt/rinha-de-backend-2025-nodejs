import { Queue } from "bullmq";
import { redisConfig } from "@/config/redis";

export const paymentQueue = new Queue("payment", {
  connection: redisConfig,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: "exponential",
      delay: 500,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});
