import { DomainError } from '@/shared/domain/errors/domainError';

export class PurchaseLineNameInvalidError extends DomainError {
  readonly code = 'PURCHASE_LINE_NAME_INVALID';

  constructor(message = 'Purchase line name cannot be empty') {
    super(message);
  }
}
