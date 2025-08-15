export interface StorageEntity {
  amount: number;
  requestedAt: number;
}

export interface Storage {
  push(amount: number, requestedAt: number): void;
  list(): StorageEntity[];
  reset(): void;
}
