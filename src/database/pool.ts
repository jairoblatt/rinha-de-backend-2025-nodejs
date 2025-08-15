import net, { Socket } from "net";

export enum Operations {
  GET = 1,
  GET_ALL = 2,
  SET = 3,
  UPDATE = 4,
  DELETE = 5,
  DELETE_ALL = 6,
}

export enum StatusCode {
  OK = 1,
  CREATED = 2,
  NOT_FOUND = 3,
  BAD_REQUEST = 4,
}

const STATUS: Record<StatusCode, string> = {
  [StatusCode.OK]: "OK",
  [StatusCode.CREATED]: "CREATED",
  [StatusCode.NOT_FOUND]: "NOT_FOUND",
  [StatusCode.BAD_REQUEST]: "BAD_REQUEST",
};

type ResolverFn<T = any> = (value: ResponseData<T>) => void;

interface ResponseData<T = any> {
  status: StatusCode;
  statusText: string;
  data: T | null;
  success: boolean;
}

export class Connection {
  private client: Socket | null = null;
  private buffer: Buffer = Buffer.alloc(0);
  private connected = false;
  private currentResolver: ResolverFn | null = null;
  public busy = false;

  constructor(private readonly socketPath: string, private onRelease: (conn: Connection) => void) {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client = net.createConnection({ path: this.socketPath }, () => {
        this.connected = true;
        resolve();
      });

      this.client.on("data", (data) => this.handleData(data));

      this.client.on("error", (err) => {
        if (!this.connected) reject(err);
      });

      this.client.on("close", () => {
        this.connected = false;
      });
    });
  }

  private buildMessage(
    opcode: Operations,
    resourceId: string | null = null,
    body: any = null
  ): Buffer {
    const bodyBuffer = body ? Buffer.from(JSON.stringify(body)) : Buffer.alloc(0);
    const idBuffer = resourceId
      ? Buffer.from(resourceId.replace(/-/g, ""), "hex")
      : Buffer.alloc(16);

    let contentLength: number;
    if (opcode === Operations.GET_ALL || opcode === Operations.DELETE_ALL) {
      contentLength = 1;
    } else if (opcode === Operations.GET || opcode === Operations.DELETE) {
      contentLength = 1 + 16;
    } else {
      contentLength = 1 + 16 + bodyBuffer.length;
    }

    const buffer = Buffer.alloc(4 + contentLength);
    buffer.writeUInt32BE(contentLength, 0);
    buffer.writeUInt8(opcode, 4);

    if (opcode !== Operations.GET_ALL && opcode !== Operations.DELETE_ALL) {
      idBuffer.copy(buffer, 5);
      if (bodyBuffer.length > 0) {
        bodyBuffer.copy(buffer, 21);
      }
    }

    return buffer;
  }

  private handleData(data: Buffer): void {
    this.buffer = Buffer.concat([this.buffer, data]);

    while (this.buffer.length >= 4) {
      const contentLength = this.buffer.readUInt32BE(0);

      if (contentLength === 0) {
        this.buffer = this.buffer.slice(4);
        continue;
      }

      if (contentLength > 4294967295) {
        this.buffer = Buffer.alloc(0);
        break;
      }

      if (this.buffer.length < 4 + contentLength) {
        break;
      }

      const message = this.buffer.slice(4, 4 + contentLength);

      if (message.length === 0) {
        this.buffer = this.buffer.slice(4 + contentLength);
        continue;
      }

      const status = message.readUInt8(0) as StatusCode;
      const payload = message.slice(1);

      this.processResponse(status, payload);
      this.buffer = this.buffer.slice(4 + contentLength);
    }
  }

  private processResponse(status: StatusCode, payload: Buffer): void {
    if (status < 1 || status > 4) {
      if (this.currentResolver) {
        this.currentResolver({
          status: StatusCode.BAD_REQUEST,
          statusText: "BAD_REQUEST",
          data: null,
          success: false,
        });
        this.currentResolver = null;
      }
      return;
    }

    const statusText = STATUS[status] || `UNKNOWN(${status})`;
    let parsedPayload: any = null;

    if (payload.length > 0) {
      try {
        parsedPayload = JSON.parse(payload.toString());
      } catch {
        if (status === StatusCode.OK && payload.length > 0) {
          parsedPayload = this.parseGetAllResponse(payload);
        } else {
          parsedPayload = payload.toString("hex");
        }
      }
    }

    if (this.currentResolver) {
      this.currentResolver({
        status,
        statusText,
        data: parsedPayload,
        success: status === StatusCode.OK || status === StatusCode.CREATED,
      });
      this.currentResolver = null;
    }
  }

  private parseGetAllResponse(payload: Buffer): { id: string; data: any }[] {
    const results: { id: string; data: any }[] = [];
    let offset = 0;

    while (offset < payload.length) {
      if (offset + 20 > payload.length) {
        break;
      }

      const id = payload.slice(offset, offset + 16).toString("hex");
      const bodyLength = payload.readUInt32BE(offset + 16);
      offset += 20;

      if (bodyLength > 1000000) {
        break;
      }

      if (offset + bodyLength > payload.length) {
        break;
      }

      const bodyData = payload.slice(offset, offset + bodyLength);
      offset += bodyLength;

      try {
        const parsedBody = JSON.parse(bodyData.toString());
        results.push({ id, data: parsedBody });
      } catch {
        results.push({ id, data: bodyData.toString("hex") });
      }
    }

    return results;
  }

  async sendRequest<T = any>(
    opcode: Operations,
    resourceId: string | null = null,
    body: any = null
  ): Promise<ResponseData<T>> {
    if (!this.connected) {
      throw new Error("Conexão não está ativa");
    }

    const message = this.buildMessage(opcode, resourceId, body);

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (this.currentResolver === resolve) {
          this.currentResolver = null;
          reject(new Error("Timeout na operação"));
        }
      }, 5000);

      this.currentResolver = (result) => {
        clearTimeout(timeout);
        resolve(result);
      };

      this.client!.write(message);
    });
  }

  disconnect(): void {
    if (this.client) {
      this.client.end();
    }
  }

  release(): void {
    this.busy = false;
    if (this.onRelease) {
      this.onRelease(this);
    }
  }
}

export class ConnectionPool {
  private connections: Connection[] = [];
  private available: Connection[] = [];
  private waitingQueue: ((conn: Connection) => void)[] = [];

  constructor(private readonly size: number, private readonly socketPath: string) {}

  async initialize(): Promise<void> {
    for (let i = 0; i < this.size; i++) {
      const connection = new Connection(this.socketPath, (conn) => this.returnConnection(conn));
      await connection.connect();
      this.connections.push(connection);
      this.available.push(connection);
    }
  }

  async getConnection(): Promise<Connection> {
    return new Promise((resolve) => {
      if (this.available.length > 0) {
        const connection = this.available.pop()!;
        connection.busy = true;
        resolve(connection);
      } else {
        this.waitingQueue.push(resolve);
      }
    });
  }

  private returnConnection(connection: Connection): void {
    if (this.waitingQueue.length > 0) {
      const resolver = this.waitingQueue.shift()!;
      connection.busy = true;
      resolver(connection);
    } else {
      this.available.push(connection);
    }
  }

  async close(): Promise<void> {
    for (const connection of this.connections) {
      connection.disconnect();
    }
    this.connections = [];
    this.available = [];
  }
}
