type PaymentFn = (data: any) => Promise<any>;

interface CircuitBreakerOptions {
  failureThreshold?: number;
  openTimeout?: number;
  halfOpenMaxCalls?: number;
  successThreshold?: number;
  historySize?: number;
  adaptiveThreshold?: number;
}

interface CircuitBreakerMetrics {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  successRate: number;
  state: string;
  lastStateChange: number;
}

export class AdaptiveCircuitBreaker {
  private state: "CLOSED" | "OPEN" | "HALF_OPEN" = "CLOSED";
  private failureCount = 0;
  private lastFailureTime: number | null = null;
  private lastStateChangeTime = Date.now();
  private halfOpenCalls = 0;
  private successfulHalfOpenCalls = 0;
  private history: boolean[] = [];
  private pendingRequests = new Set<Promise<any>>();

  private readonly failureThreshold: number;
  private readonly openTimeout: number;
  private readonly halfOpenMaxCalls: number;
  private readonly successThreshold: number;
  private readonly historySize: number;
  private readonly adaptiveThreshold: number;

  constructor(
    private readonly defaultFn: PaymentFn,
    private readonly fallbackFn: PaymentFn,
    options: CircuitBreakerOptions = {}
  ) {
    this.failureThreshold = options.failureThreshold ?? 5;
    this.openTimeout = options.openTimeout ?? 10000;
    this.halfOpenMaxCalls = options.halfOpenMaxCalls ?? 3;
    this.successThreshold = options.successThreshold ?? 2;
    this.historySize = options.historySize ?? 20;
    this.adaptiveThreshold = options.adaptiveThreshold ?? 0.8;
  }

  async execute(data: any): Promise<any> {
    switch (this.state) {
      case "CLOSED":
        return await this.executeInClosedState(data);

      case "OPEN":
        return await this.executeInOpenState(data);

      case "HALF_OPEN":
        return await this.executeInHalfOpenState(data);

      default:
        throw new Error(`Invalid circuit breaker state: ${this.state}`);
    }
  }

  private async executeInClosedState(data: any): Promise<any> {
    // No estado CLOSED, verifica se deve usar lógica adaptativa
    const successRate = this.calculateSuccessRate();

    if (this.shouldUseAdaptiveLogic() && successRate < this.adaptiveThreshold) {
      return this.fallbackFn(data);
    }

    return this.tryDefaultFunction(data);
  }

  private async executeInOpenState(data: any): Promise<any> {
    const now = Date.now();

    if (this.lastFailureTime && now - this.lastFailureTime >= this.openTimeout) {
      this.transitionToHalfOpen();
      return this.executeInHalfOpenState(data);
    }

    return this.fallbackFn(data);
  }

  private async executeInHalfOpenState(data: any): Promise<any> {
    // No estado HALF_OPEN, permite apenas um número limitado de tentativas
    if (this.halfOpenCalls >= this.halfOpenMaxCalls) {
      return this.fallbackFn(data);
    }

    this.halfOpenCalls++;
    return this.tryDefaultFunction(data);
  }

  private async tryDefaultFunction(data: any): Promise<any> {
    const promise = this.defaultFn(data);
    this.pendingRequests.add(promise);

    try {
      const result = await promise;
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      // No circuit breaker, quando a função principal falha, devemos usar o fallback
      // ao invés de propagar o erro
      return this.fallbackFn(data);
    } finally {
      this.pendingRequests.delete(promise);
    }
  }

  private onSuccess(): void {
    this.recordResult(true);

    switch (this.state) {
      case "CLOSED":
        // Reset failure count on success
        this.failureCount = 0;
        break;

      case "HALF_OPEN":
        this.successfulHalfOpenCalls++;

        if (this.successfulHalfOpenCalls >= this.successThreshold) {
          this.transitionToClosed();
        }
        break;
    }
  }

  private onFailure(): void {
    this.recordResult(false);
    this.failureCount++;
    this.lastFailureTime = Date.now();

    switch (this.state) {
      case "CLOSED":
        if (this.failureCount >= this.failureThreshold) {
          this.transitionToOpen();
        }
        break;

      case "HALF_OPEN":
        this.transitionToOpen();
        break;
    }
  }

  private transitionToOpen(): void {
    this.state = "OPEN";
    this.lastStateChangeTime = Date.now();
    this.lastFailureTime = Date.now();
    this.resetHalfOpenCounters();
  }

  private transitionToHalfOpen(): void {
    this.state = "HALF_OPEN";
    this.lastStateChangeTime = Date.now();
    this.resetHalfOpenCounters();
  }

  private transitionToClosed(): void {
    this.state = "CLOSED";
    this.lastStateChangeTime = Date.now();
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.resetHalfOpenCounters();
  }

  private resetHalfOpenCounters(): void {
    this.halfOpenCalls = 0;
    this.successfulHalfOpenCalls = 0;
  }

  private recordResult(success: boolean): void {
    this.history.push(success);

    if (this.history.length > this.historySize) {
      this.history.shift();
    }
  }

  private calculateSuccessRate(): number {
    if (this.history.length === 0) {
      return 1; // Assume success if no history
    }

    const successCount = this.history.filter((result) => result).length;
    return successCount / this.history.length;
  }

  private shouldUseAdaptiveLogic(): boolean {
    // Só usa lógica adaptativa se tiver histórico suficiente
    return this.history.length >= Math.min(10, this.historySize * 0.5);
  }

  // Métodos públicos para monitoramento
  getMetrics(): CircuitBreakerMetrics {
    const successRate = this.calculateSuccessRate();

    return {
      totalCalls: this.history.length,
      successfulCalls: this.history.filter((r) => r).length,
      failedCalls: this.history.filter((r) => !r).length,
      successRate: Math.round(successRate * 10000) / 100, // 2 casas decimais
      state: this.state,
      lastStateChange: this.lastStateChangeTime,
    };
  }

  getCurrentState(): string {
    return this.state;
  }

  getSuccessRate(): number {
    return this.calculateSuccessRate();
  }

  // Método para reset manual (útil para testes)
  reset(): void {
    this.state = "CLOSED";
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.lastStateChangeTime = Date.now();
    this.history = [];
    this.resetHalfOpenCounters();
  }

  // Método para aguardar requests pendentes (útil para shutdown graceful)
  async waitForPendingRequests(timeoutMs = 5000): Promise<void> {
    if (this.pendingRequests.size === 0) return;

    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout waiting for pending requests")), timeoutMs)
    );

    try {
      await Promise.race([Promise.allSettled(Array.from(this.pendingRequests)), timeout]);
    } catch {}
  }
}
