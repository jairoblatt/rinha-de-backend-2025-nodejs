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

    // 24 horas = 86.400.000 ms (precisa de ~27 bits)
    // Usando 20 bits para delta = ~17 minutos máximo
    // Vamos usar segundos em vez de ms para expandir
    const deltaSeconds = Math.floor(delta / 1000);

    if (deltaSeconds < 0 || deltaSeconds > 86_400) {
      // 24 horas em segundos
      throw new Error("Timestamp fora da janela permitida (0-86400 segundos)");
    }

    if (amount < 0 || amount > 4_095) {
      // 12 bits para amount
      throw new Error("Amount fora do intervalo suportado (0-4095)");
    }

    // 20 bits para deltaSeconds + 12 bits para amount
    const packed = (deltaSeconds << 12) | amount;
    this.data.push(packed);
  }

  list(): StorageEntry[] {
    return this.data.map((entry) => {
      const deltaSeconds = entry >>> 12;
      const amount = entry & 0xfff;

      return {
        amount,
        requestedAt: this.startTimestamp + deltaSeconds * 1000,
      };
    });
  }
}
