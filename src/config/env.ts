interface Config {
  SocketPath: string;
  HealthCheckInterval: number;
  HealthCheckSourceRedis: boolean;
  RedisHost: string;
  RedisPort: number;
}

const config: Config = {
  SocketPath: process.env.SOCKET_PATH || "/tmp/app.sock",
  HealthCheckInterval: Number(process.env.HEALTH_CHECK_INTERVAL) || 5_000,
  HealthCheckSourceRedis: process.env.HEALTH_CHECK_SOURCE_REDIS === "true" || false,
  RedisHost: process.env.REDIS_HOST || "127.0.0.1",
  RedisPort: Number(process.env.REDIS_PORT) || 6379,
};

export { config };
