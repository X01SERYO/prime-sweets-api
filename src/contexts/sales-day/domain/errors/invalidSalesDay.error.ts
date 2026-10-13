import { DomainError } from '../../../../shared/domain/errors/domainError';

export class InvalidSalesDayError extends DomainError {
  readonly code = 'SALES_DAY_INVALID';

  constructor(message: string) {
    super(message);
  }
}
