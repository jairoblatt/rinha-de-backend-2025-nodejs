import { Queue } from "../Queue";
import state from "../state";

const queue = new Queue(state, {
  workers: 2,
});

export { queue };
