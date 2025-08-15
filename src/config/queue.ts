import { Queue } from "@/services/queue";
import { config } from "@/config/env";
import { storageDefault, storageFallback } from "@/config/storage";

const queueOptions = {
  workers: config.Workers,
  isFireMotherFucker: config.isFireMotherFucker,
};

export const queue = new Queue(storageDefault, storageFallback, queueOptions);
