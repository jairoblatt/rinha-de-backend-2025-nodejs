import { DatabaseClient } from "@/database";
import { config } from ".";

export const databaseClient = new DatabaseClient({
  poolSize: 10,
  socketPath: config.BeerCacheSocketPath,
});
