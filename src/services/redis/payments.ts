import { redisClient } from "@/config/redis";
import type { PaymentData } from "../payments/paymentProcessor";

const REDIS_KEY = "pp-payments";

export const RedisPaymentsService = {
  async push(data: PaymentData) {
    await redisClient.lpush(REDIS_KEY, JSON.stringify(data));
  },

  async list(): Promise<PaymentData[]> {
    const result = await redisClient.lrange(REDIS_KEY, 0, -1);
    return result.map((item) => JSON.parse(item) as PaymentData);
  },
};
