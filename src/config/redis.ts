import { Redis } from "ioredis";
import { ConnectionOptions } from "bullmq";
import { config } from "@/config";

export const redisConfig: ConnectionOptions = {
  host: config.RedisHost,
  port: config.RedisPort,
};

export const redisClient = new Redis(redisConfig);
