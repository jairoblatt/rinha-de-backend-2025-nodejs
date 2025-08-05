import { Queue } from "../Queue";
import { config } from "./env";
import { storage } from "./storage";

const queue = new Queue(storage, {
  workers: 1,
  isFireMotherFucker: config.isFireMotherFucker,
});

export { queue };
