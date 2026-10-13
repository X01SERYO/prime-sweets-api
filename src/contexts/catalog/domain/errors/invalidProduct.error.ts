import { DomainError } from '../../../../shared/domain/errors/domainError';

export class InvalidProductError extends DomainError {
  readonly code = 'PRODUCT_INVALID';

  constructor(message: string) {
    super(message);
  }
}
