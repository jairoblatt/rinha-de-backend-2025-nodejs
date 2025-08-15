import { ConnectionPool, Connection, Operations, StatusCode } from "./pool";

export interface ResourceBody {
  amount: number;
  requestedAt: string;
  paymentProcessor: number;
}

export interface ResourceBodyRead {
  id: string;
  data: ResourceBody;
}

interface ResponseData<T = any> {
  status: StatusCode;
  statusText: string;
  data: T | null;
  success: boolean;
}

interface DatabaseClientOptions {
  poolSize: number;
  socketPath: string;
}

export class DatabaseClient {
  private pool: ConnectionPool;
  private initialized = false;

  constructor(readonly options: DatabaseClientOptions) {
    this.pool = new ConnectionPool(options.poolSize, options.socketPath);
  }

  async initialize(): Promise<void> {
    if (!this.initialized) {
      await this.pool.initialize();
      this.initialized = true;
    }
  }

  private async executeOperation<T>(
    operation: (conn: Connection) => Promise<ResponseData<T>>
  ): Promise<ResponseData<T>> {
    if (!this.initialized) {
      await this.initialize();
    }

    const connection = await this.pool.getConnection();
    try {
      return await operation(connection);
    } finally {
      connection.release();
    }
  }

  async set(resourceId: string, data: ResourceBody): Promise<ResponseData> {
    return await this.executeOperation((conn) =>
      conn.sendRequest(Operations.SET, resourceId, data)
    );
  }

  async get(resourceId: string): Promise<ResourceBodyRead | null> {
    const response = await this.executeOperation<ResourceBodyRead>((conn) =>
      conn.sendRequest(Operations.GET, resourceId)
    );

    return response.success ? response.data : null;
  }

  async getAll(): Promise<ResourceBodyRead[]> {
    const response = await this.executeOperation<ResourceBodyRead[]>((conn) =>
      conn.sendRequest(Operations.GET_ALL)
    );

    return response.success ? response.data! : [];
  }

  async update(resourceId: string, data: any): Promise<ResponseData> {
    return await this.executeOperation((conn) =>
      conn.sendRequest(Operations.UPDATE, resourceId, data)
    );
  }

  async delete(resourceId: string): Promise<ResponseData> {
    return await this.executeOperation((conn) => {
      return conn.sendRequest(Operations.DELETE, resourceId);
    });
  }

  async deleteAll(): Promise<ResponseData> {
    return await this.executeOperation((conn) => {
      return conn.sendRequest(Operations.DELETE_ALL);
    });
  }

  async close(): Promise<void> {
    await this.pool.close();
  }
}
