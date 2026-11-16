import { DomainError } from '@/shared/domain/errors/domainError';

export class ProductNotLinkedError extends DomainError {
  readonly code = 'PRODUCT_NOT_LINKED';

  constructor(productId: string) {
    super(`Product "${productId}" is not linked to the supplier`);
  }
}
