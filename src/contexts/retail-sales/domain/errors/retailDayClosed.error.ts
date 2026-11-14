import { DomainError } from '@/shared/domain/errors/domainError';

export class RetailDayClosedError extends DomainError {
  readonly code = 'RETAIL_DAY_CLOSED';

  constructor(businessDate: string) {
    super(`Retail day "${businessDate}" is closed`);
  }
}
