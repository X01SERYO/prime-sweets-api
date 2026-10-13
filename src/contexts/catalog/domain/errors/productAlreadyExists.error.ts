import { DomainError } from '../../../../shared/domain/errors/domainError';

export class ProductAlreadyExistsError extends DomainError {
  readonly code = 'PRODUCT_ALREADY_EXISTS';

  constructor(alegraId: string) {
    super(`Product with Alegra id "${alegraId}" already exists`);
  }
}
