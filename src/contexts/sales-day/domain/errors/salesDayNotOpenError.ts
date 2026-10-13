import { DomainError } from '../../../../shared/domain/errors/domainError';

export class SalesDayNotOpenError extends DomainError {
  readonly code = 'SALES_DAY_NOT_OPEN';

  constructor(message = 'Sales Day is not open') {
    super(message);
  }
}
