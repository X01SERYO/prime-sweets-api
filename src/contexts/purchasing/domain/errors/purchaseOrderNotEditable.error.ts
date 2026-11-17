import { DomainError } from '@/shared/domain/errors/domainError';

export class PurchaseOrderNotEditableError extends DomainError {
  readonly code = 'PURCHASE_ORDER_NOT_EDITABLE';

  constructor(message = 'Only the latest purchase order can be edited') {
    super(message);
  }
}
