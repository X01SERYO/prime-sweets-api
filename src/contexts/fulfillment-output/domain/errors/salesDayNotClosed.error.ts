import { DomainError } from '../../../../shared/domain/errors/domainError';

export class SalesDayNotClosedError extends DomainError {
  readonly code = 'SALES_DAY_NOT_CLOSED';

  constructor(salesDayId: string) {
    super(`Load Sheet requires Sales Day "${salesDayId}" to be CLOSED`);
  }
}
