import { Socket } from "net";

const OP_SET = 1;
const OP_GET = 2;

export interface StorageEntry {
  amount: number;
  requestedAt: number;
}

export enum PaymentStorage {
  Default = 1,
  Fallback = 2,
}

export class Storage {
  private startTimestamp: number;
  private socket: Socket | null = null;

  constructor() {
    this.startTimestamp = Date.now();
  }

  private async connect(): Promise<Socket> {
    if (this.socket && !this.socket.destroyed) {
      return this.socket;
    }

    return new Promise((resolve, reject) => {
      const socket = new Socket();
      let connected = false;

      const timeout = setTimeout(() => {
        if (!connected) {
          connected = true;
          socket.destroy();
          reject(new Error("Connection timeout"));
        }
      }, 5000);

      socket.connect("/tmp/map8x32.sock", () => {
        if (!connected) {
          connected = true;
          clearTimeout(timeout);
          this.socket = socket;
          resolve(socket);
        }
      });

      socket.on("error", (err) => {
        if (!connected) {
          connected = true;
          clearTimeout(timeout);
          reject(err);
        }
      });
    });
  }

  private packValue(entry: StorageEntry): { high: number; low: number } {
    const delta = entry.requestedAt - this.startTimestamp;
    const deltaSeconds = Math.floor(delta / 1000);

    if (deltaSeconds < 0 || deltaSeconds > 600) {
      throw new Error("Timestamp fora da janela de 10 minutos");
    }

    if (entry.amount < 0 || entry.amount > 0xffffffff) {
      throw new Error("Amount fora do intervalo suportado");
    }

    // High 32 bits: deltaSeconds (10 bits) + padding (22 bits)
    const high = (deltaSeconds << 22) >>> 0;
    // Low 32 bits: amount completo
    const low = entry.amount >>> 0;

    return { high, low };
  }

  private unpackValue(high: number, low: number): StorageEntry {
    const deltaSeconds = high >>> 22;
    const amount = low;

    return {
      amount,
      requestedAt: this.startTimestamp + deltaSeconds * 1000,
    };
  }

  private async sendRequest(
    operation: number,
    key: PaymentStorage,
    value?: number
  ): Promise<Buffer> {
    const socket = await this.connect();

    return new Promise((resolve, reject) => {
      const request = Buffer.alloc(6);
      request.writeUInt8(operation, 0);
      request.writeUInt8(key, 1);

      if (value !== undefined) {
        request.writeUInt32LE(value, 2);
      } else {
        request.writeUInt32LE(0, 2);
      }

      let responseBuffer = Buffer.alloc(0);
      let resolved = false;

      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          socket.off("data", onData);
          socket.off("error", onError);
          reject(new Error("Request timeout"));
        }
      }, 5000);

      const cleanup = () => {
        clearTimeout(timeout);
        socket.off("data", onData);
        socket.off("error", onError);
      };

      const onData = (data: Buffer) => {
        responseBuffer = Buffer.concat([responseBuffer, data]);

        if (responseBuffer.length >= 1) {
          const status = responseBuffer.readUInt8(0);

          if (operation === OP_SET) {
            if (!resolved) {
              resolved = true;
              cleanup();
              resolve(responseBuffer);
            }
          } else if (operation === OP_GET) {
            if (status === 0) {
              if (!resolved) {
                resolved = true;
                cleanup();
                resolve(responseBuffer);
              }
            } else if (responseBuffer.length >= 5) {
              const count = responseBuffer.readUInt32LE(1);
              const expectedLength = 5 + count * 4;

              if (responseBuffer.length >= expectedLength) {
                if (!resolved) {
                  resolved = true;
                  cleanup();
                  resolve(responseBuffer);
                }
              }
            }
          }
        }
      };

      const onError = (err: Error) => {
        if (!resolved) {
          resolved = true;
          cleanup();
          reject(err);
        }
      };

      socket.on("data", onData);
      socket.on("error", onError);

      socket.write(request);
    });
  }

  async push(key: PaymentStorage, entry: StorageEntry): Promise<void> {
    const { high, low } = this.packValue(entry);

    // Salva duas entradas: primeiro o high, depois o low
    await this.sendRequest(OP_SET, key, high);
    await this.sendRequest(OP_SET, key, low);
  }

  async list(key: PaymentStorage): Promise<StorageEntry[]> {
    const response = await this.sendRequest(OP_GET, key);
    const status = response.readUInt8(0);

    if (status === 0) {
      return [];
    }

    if (status === 2) {
      throw new Error("Bad request");
    }

    const count = response.readUInt32LE(1);
    const entries: StorageEntry[] = [];

    for (let i = 0; i < count; i += 2) {
      if (i + 1 >= count) {
        break;
      }

      const highOffset = 5 + i * 4;
      const lowOffset = 5 + (i + 1) * 4;

      const high = response.readUInt32LE(highOffset);
      const low = response.readUInt32LE(lowOffset);

      entries.push(this.unpackValue(high, low));
    }

    return entries;
  }

  close(): void {
    if (this.socket && !this.socket.destroyed) {
      this.socket.destroy();
      this.socket = null;
    }
  }
}
