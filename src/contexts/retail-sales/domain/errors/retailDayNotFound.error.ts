import { DomainError } from '@/shared/domain/errors/domainError';

export class RetailDayNotFoundError extends DomainError {
  readonly code = 'RETAIL_DAY_NOT_FOUND';

  constructor(businessDate: string) {
    super(`Retail day "${businessDate}" was not found`);
  }
}
