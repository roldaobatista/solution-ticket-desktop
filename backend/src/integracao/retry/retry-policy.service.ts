import { Injectable } from '@nestjs/common';

export type IntegrationErrorCategory = 'technical' | 'business';

@Injectable()
export class RetryPolicyService {
  private readonly maxAttempts = 8;
  private readonly baseDelayMs = 30_000;
  private readonly maxDelayMs = 60 * 60 * 1000;

  shouldRetry(category: IntegrationErrorCategory, attempts: number): boolean {
    return category === 'technical' && attempts < this.maxAttempts;
  }

  nextRetryAt(attempts: number, now = new Date()): Date {
    const exponential = this.baseDelayMs * 2 ** Math.max(0, attempts - 1);
    const capped = Math.min(exponential, this.maxDelayMs);
    const jitter = Math.floor(capped * 0.2 * Math.random());
    return new Date(now.getTime() + capped + jitter);
  }
}
