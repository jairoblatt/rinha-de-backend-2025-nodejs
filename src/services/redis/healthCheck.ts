import { redisClient } from "@/config/redis";
import type { CheckHealthResponse } from "../payments/paymentProcessor";

const REDIS_KEY = "pp-health-check-default";

export const RedisHealthCheckService = {
  async get(): Promise<CheckHealthResponse> {
    const result = await redisClient.get(REDIS_KEY);

    if (!result) {
      throw new Error("Health check data not found in Redis");
    }

    try {
      const resultParsed = JSON.parse(result);
      return resultParsed as CheckHealthResponse;
    } catch {
      throw new Error("Invalid JSON format in Redis");
    }
  },

  async set(data: CheckHealthResponse): Promise<void> {
    await redisClient.set(REDIS_KEY, JSON.stringify(data));
  },
};
