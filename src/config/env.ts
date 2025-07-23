interface Config {
  SocketPath: string;
  HealthCheckInterval: number;
  HealthCheckSourceRedis: boolean;
  RedisHost: string;
  RedisPort: number;
}

const config: Config = {
  SocketPath: process.env.SOCKET_PATH || "/tmp/app.sock",
  HealthCheckInterval: process.env.HEALTH_CHECK_INTERVAL ? Number(process.env.HEALTH_CHECK_INTERVAL) : 5_000,
  HealthCheckSourceRedis: process.env.HEALTH_CHECK_SOURCE_REDIS === "true",
  RedisHost: process.env.REDIS_HOST || "127.0.0.1",
  RedisPort: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
};

export { config };
