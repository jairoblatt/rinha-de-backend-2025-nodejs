import { config, startServer } from "@/config";
import "@/workers";
import { appState } from "./state";
import { startHealthChecker } from "@/jobs";

startServer(config.SocketPath);

startHealthChecker({
  appState,
  interval: config.HealthCheckInterval,
  sourceRedis: config.HealthCheckSourceRedis,
});
