interface Config {
  isFireMotherFucker: boolean;
  Workers: number;
  Hostname: string;
  BeerCacheSocketPath: string;
  FallbackInterval: number;
}

const config: Config = {
  isFireMotherFucker: process.env.MODE === "🔥",
  Hostname: process.env.HOSTNAME || "localhost",
  Workers: parseInt(process.env.WORKERS || "1", 10),
  FallbackInterval: parseInt(process.env.FALLBACK_INTERVAL || "10", 10),
  BeerCacheSocketPath: process.env.BEER_CACHE_SOCKET_PATH || "/tmp/beer_cache.sock",
};

export { config };
