import { Queue } from "../Queue";
import { config } from "./env";
import { appState } from "../state";

const queue = new Queue({
  appState,
  concurency: 2,
  sourceRedis: config.HealthCheckSourceRedis,
});

export { queue };
