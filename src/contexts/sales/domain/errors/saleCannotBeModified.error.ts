import { DomainError } from '../../../../shared/domain/errors/domainError';

export class SaleCannotBeModifiedError extends DomainError {
  readonly code = 'SALE_CANNOT_BE_MODIFIED';

  constructor(message: string) {
    super(message);
  }
}
