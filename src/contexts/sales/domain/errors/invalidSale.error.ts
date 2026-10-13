import { DomainError } from '../../../../shared/domain/errors/domainError';

export class InvalidSaleError extends DomainError {
  readonly code = 'SALE_INVALID';

  constructor(message: string) {
    super(message);
  }
}
