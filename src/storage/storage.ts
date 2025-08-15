import { StorageEntity, Storage } from "./storage.protocol";

export class BitPackingStorage implements Storage {
  private startTimestamp: number;
  private readonly data: number[] = [];

  constructor() {
    this.startTimestamp = Date.now();
  }

  reset(): void {
    this.data.length = 0;
    this.startTimestamp = Date.now();
  }

  push(amount: number, currentTimestamp: number): void {
    const delta = currentTimestamp - this.startTimestamp;

    if (delta < 0 || delta > 86_400_000) {
      throw new Error("Timestamp fora da janela permitida (0-86400000 ms)");
    }

    if (amount < 0 || amount > 4_095) {
      throw new Error("Amount fora do intervalo suportado (0-4095)");
    }

    const packed = (delta << 12) | amount;
    this.data.push(packed);
  }

  list(): StorageEntity[] {
    return this.data.map((entry) => {
      const delta = entry >>> 12;
      const amount = entry & 0xfff;
      return {
        amount,
        requestedAt: this.startTimestamp + delta,
      };
    });
  }
}
