import { DomainError } from '@/shared/domain/errors/domainError';

export class ProductWithoutCostError extends DomainError {
  readonly code = 'PRODUCT_WITHOUT_COST';

  constructor(productId: string) {
    super(`Product "${productId}" has no cost`);
  }
}
