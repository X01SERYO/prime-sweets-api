import { DomainError } from '@/shared/domain/errors/domainError';

export class PurchaseOrderEmptyError extends DomainError {
  readonly code = 'PURCHASE_ORDER_EMPTY';

  constructor(message = 'A purchase order needs at least one line') {
    super(message);
  }
}
