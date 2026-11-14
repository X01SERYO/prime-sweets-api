import { DomainError } from '@/shared/domain/errors/domainError';

export class RetailDayAlreadyReviewedError extends DomainError {
  readonly code = 'RETAIL_DAY_ALREADY_REVIEWED';
  readonly dates: string[];

  constructor(dates: string | string[]) {
    const list = Array.isArray(dates) ? dates : [dates];
    super(
      list.length === 1
        ? `Retail day "${list[0]}" is already reviewed`
        : `Retail days are already reviewed: ${list.join(', ')}`
    );
    this.dates = list;
  }
}
