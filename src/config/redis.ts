// import { RedisOptions } from "ioredis";
import { ConnectionOptions } from "bullmq";

export const redisConfig: ConnectionOptions = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT) || 6379,
};
