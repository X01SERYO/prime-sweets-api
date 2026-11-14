import { DomainError } from '@/shared/domain/errors/domainError';

export class RetailDayAlreadyReviewedError extends DomainError {
  readonly code = 'RETAIL_DAY_ALREADY_REVIEWED';

  constructor(readonly businessDate: string) {
    super(`Retail day "${businessDate}" is already reviewed`);
  }
}
