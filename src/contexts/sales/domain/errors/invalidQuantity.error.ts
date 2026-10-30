import { DomainError } from '../../../../shared/domain/errors/domainError';

export class InvalidQuantityError extends DomainError {
  readonly code = 'INVALID_QUANTITY';

  constructor(message = 'Quantity must be greater than 0') {
    super(message);
  }
}
