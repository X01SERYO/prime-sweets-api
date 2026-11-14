import { DomainError } from '@/shared/domain/errors/domainError';

export class InvalidRetailQuantityError extends DomainError {
  readonly code = 'INVALID_RETAIL_QUANTITY';

  constructor(message = 'Quantity must be an integer of at least 1') {
    super(message);
  }
}
