import type { ServerResponse, IncomingMessage } from "http";

export enum HttpStatus {
  OK = 200,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500,
}

export function sendReponse(res: ServerResponse, statusCode: number, data?: object) {
  res.writeHead(statusCode, {
    "content-type": "application/json",
  });

  res.end(data ? JSON.stringify(data) : "");
}

export function readBodyBufferCallback<T extends object>(
  req: IncomingMessage,
  cb: (err: Error | null, body?: T) => void
) {
  const chunks: Buffer[] = [];

  req.on("data", (chunk) => {
    chunks.push(chunk);
  });

  req.on("end", () => {
    try {
      const body = Buffer.concat(chunks).toString();
      const parsedBody = JSON.parse(body);
      cb(null, parsedBody);
    } catch {
      cb(new Error("Invalid JSON format"));
    }
  });

  req.on("error", (err) => cb(err));
}

export function readBody<T extends object>(req: IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    let body: string = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        const parsedBody = JSON.parse(body);
        resolve(parsedBody);
      } catch (error) {
        reject(new Error("Invalid JSON format"));
      }
    });

    req.on("error", (err) => reject(err));
  });
}

export function readQueryParams(req: IncomingMessage): Record<string, string> {
  const url = new URL(req.url || "", `http://${req.headers.host}`);

  const params: Record<string, string> = {};

  for (const [key, value] of url.searchParams.entries()) {
    params[key] = value;
  }

  return params;
}
