interface Config {
  SocketPath: string;
  HealthCheckInterval: number;
  HealthCheckSourceRedis: boolean;
  RedisSocketPath: string;
}

const config: Config = {
  SocketPath: process.env.SOCKET_PATH || "/tmp/app.sock",
  HealthCheckInterval: process.env.HEALTH_CHECK_INTERVAL ? Number(process.env.HEALTH_CHECK_INTERVAL) : 5_000,
  HealthCheckSourceRedis: process.env.HEALTH_CHECK_SOURCE_REDIS === "true",
  RedisSocketPath: process.env.REDIS_SOCKET_PATH || "/tmp/redis.sock",
};

export { config };
