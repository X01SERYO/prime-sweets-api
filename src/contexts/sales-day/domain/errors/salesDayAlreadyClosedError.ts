import { DomainError } from '../../../../shared/domain/errors/domainError';

export class SalesDayAlreadyClosedError extends DomainError {
  readonly code = 'SALES_DAY_ALREADY_CLOSED';

  constructor(message = 'Sales Day is already closed') {
    super(message);
  }
}
