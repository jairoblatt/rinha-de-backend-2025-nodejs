import { config, startServer } from "@/config";
import { appState } from "./state";
import { startHealthChecker } from "@/jobs";
// import { Queue } from "./Queue";

// const queue = new Queue({
//   concurency: 2,
// });

// for (let i = 0; i < 10; i++) {
//   queue.push({
//     ammount: i,
//     correlationId: `cor. ${i}`,
//   });
// }

startServer(config.SocketPath);

startHealthChecker({
  appState,
  interval: config.HealthCheckInterval,
  sourceRedis: config.HealthCheckSourceRedis,
});
