import { DomainError } from '../../../../shared/domain/errors/domainError';

export class SaleMustContainItemsError extends DomainError {
  readonly code = 'SALE_MUST_CONTAIN_ITEMS';

  constructor(message = 'A sale must contain at least one item when confirmed') {
    super(message);
  }
}
