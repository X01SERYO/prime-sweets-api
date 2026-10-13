import { DomainError } from '../../../../shared/domain/errors/domainError';

export class SalesDayCannotBeReopenedError extends DomainError {
  readonly code = 'SALES_DAY_CANNOT_BE_REOPENED';

  constructor(message = 'Only the current calendar day Sales Day may be reopened') {
    super(message);
  }
}
