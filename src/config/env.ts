interface Config {
  ExternalSummaryHostname: string;
  isFireMotherFucker: boolean;
  Workers: number;
  Hostname: string;
  BeerCacheSocketPath: string;
}

const config: Config = {
  isFireMotherFucker: process.env.MODE === "🔥",
  Hostname: process.env.HOSTNAME || "localhost",
  Workers: parseInt(process.env.WORKERS || "1", 10),
  ExternalSummaryHostname: process.env.EXTERNAL_SUMMARY_HOSTNAME || "",
  BeerCacheSocketPath: process.env.BEER_CACHE_SOCKET_PATH || "/tmp/beer_cache.sock",
};

export { config };
