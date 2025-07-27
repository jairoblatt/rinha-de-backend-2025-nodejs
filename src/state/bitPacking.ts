export interface StorageEntry {
  amount: number;
  requestedAt: number;
}

export class BitPackingPaymentStorage {
  private readonly startTimestamp: number;
  private readonly data: number[] = [];

  constructor() {
    this.startTimestamp = Date.now();
  }

  push(amount: number, currentTimestamp: number): void {
    const delta = currentTimestamp - this.startTimestamp;

    if (delta < 0 || delta > 120_000) {
      throw new Error("Timestamp fora da janela permitida (0-120000ms)");
    }

    if (amount < 0 || amount > 1_048_575) {
      throw new Error("Amount fora do intervalo suportado (0-1048575)");
    }

    const packed = (delta << 20) | amount;
    this.data.push(packed);
  }

  list(): StorageEntry[] {
    return this.data.map((entry) => {
      const delta = entry >>> 20;
      const amount = entry & 0xfffff;

      return {
        amount,
        requestedAt: this.startTimestamp + delta,
      };
    });
  }
}
