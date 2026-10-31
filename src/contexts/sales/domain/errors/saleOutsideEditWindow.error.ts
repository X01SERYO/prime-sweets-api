import { DomainError } from '../../../../shared/domain/errors/domainError';

export class SaleOutsideEditWindowError extends DomainError {
  readonly code = 'SALE_OUTSIDE_EDIT_WINDOW';

  constructor() {
    super('The sale is outside the current week and cannot be changed');
  }
}
