import { DomainError } from '../../../../shared/domain/errors/domainError';

export class SalesDayNotOpenForSaleError extends DomainError {
  readonly code = 'SALES_DAY_NOT_OPEN';

  constructor(salesDayId: string) {
    super(`Sales day "${salesDayId}" is closed. Sales cannot be created or modified.`);
  }
}
