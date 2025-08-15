import http from "http";
import { createSocketPath } from "@/shared";

interface HttpClientOptions {
  hostname: string;
  path: string;
  method?: string;
  timeout?: number;
}

export async function httpGet<T>(options: HttpClientOptions): Promise<T> {
  return httpRequest<T>({
    ...options,
    method: "GET",
  });
}

function httpRequest<T>(options: HttpClientOptions): Promise<T> {
  const timeout = options.timeout || 3000;
  const socketPath = createSocketPath(options.hostname);

  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        socketPath,
        path: options.path,
        method: options.method || "GET",
      },
      (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          try {
            if (res.statusCode === 200) {
              const parsedData = JSON.parse(data);
              resolve(parsedData);
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${data}`));
            }
          } catch (error) {
            reject(new Error("Invalid JSON response"));
          }
        });
      }
    );

    req.setTimeout(timeout);

    req.on("error", reject);

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });

    req.end();
  });
}
