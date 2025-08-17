import type { ServerResponse, IncomingMessage } from "http";

export enum HttpStatus {
  OK = 200,
  NOT_FOUND = 404,
  CONFLICT = 409,
  INTERNAL_SERVER_ERROR = 500,
}

export function sendResponse(res: ServerResponse, statusCode: number, data?: object) {
  res.writeHead(statusCode, {
    "content-type": "application/json",
  });

  res.end(data ? JSON.stringify(data) : "");
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
