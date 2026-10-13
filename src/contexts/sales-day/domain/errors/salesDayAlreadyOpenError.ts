import { DomainError } from '../../../../shared/domain/errors/domainError';

export class SalesDayAlreadyOpenError extends DomainError {
  readonly code = 'SALES_DAY_ALREADY_OPEN';

  constructor(message = 'Sales Day is already open') {
    super(message);
  }
}
