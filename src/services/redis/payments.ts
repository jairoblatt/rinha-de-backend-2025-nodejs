import { redisClient } from "@/config/redis";
import { type PaymentData, PaymentProcessor } from "../payments/paymentProcessor";

interface PaymentDataRedis extends PaymentData {
  paymentProcessor: PaymentProcessor;
}

const REDIS_KEY = "pp-payments";

export const RedisPaymentsService = {
  async push(data: PaymentDataRedis) {
    await redisClient.lpush(REDIS_KEY, JSON.stringify(data));
  },

  async list(): Promise<PaymentDataRedis[]> {
    const result = await redisClient.lrange(REDIS_KEY, 0, -1);
    return result.map((item) => JSON.parse(item) as PaymentDataRedis);
  },
};
