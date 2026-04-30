export class InsufficientFundsError extends Error {
  readonly available: number;
  readonly requested: number;
  readonly source: 'main' | 'wallet' | 'savings';
  constructor(source: 'main' | 'wallet' | 'savings', available: number, requested: number) {
    super(`Insufficient funds in ${source}: ${available} available, ${requested} requested`);
    this.name = 'InsufficientFundsError';
    this.available = available;
    this.requested = requested;
    this.source = source;
  }
}

export function isInsufficientFunds(err: unknown): err is InsufficientFundsError {
  return err instanceof InsufficientFundsError;
}
