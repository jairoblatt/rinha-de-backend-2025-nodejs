import { Queue } from "@/services/queue";
import { config } from "@/config/env";

const queueOptions = {
  workers: config.Workers,
  fallbackInterval: config.FallbackInterval,
  isFireMotherFucker: config.isFireMotherFucker,
};

export const queue = new Queue(queueOptions);
