import { DomainError } from '@/shared/domain/errors/domainError';

export class InvalidPurchaseQuantityError extends DomainError {
  readonly code = 'INVALID_PURCHASE_QUANTITY';

  constructor(message = 'Quantity must be an integer of at least 1') {
    super(message);
  }
}
