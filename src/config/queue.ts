import { Queue } from "../Queue";
import { config } from "./env";
import state from "../state";

const queue = new Queue(state, {
  workers: 1,
  isFireMotherFucker: config.isFireMotherFucker,
});

export { queue };
