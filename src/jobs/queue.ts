import { Queue } from "bullmq";
import { redisConfig } from "@/config/redis";

export const paymentQueue = new Queue("payment", {
  connection: redisConfig,
});
