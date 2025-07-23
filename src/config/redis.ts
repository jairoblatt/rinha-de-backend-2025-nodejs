import { Redis } from "ioredis";
import { ConnectionOptions } from "bullmq";
import { config } from "@/config";

export const redisConfig: ConnectionOptions = {
  path: config.RedisSocketPath,
};

export const redisClient = new Redis(redisConfig);
