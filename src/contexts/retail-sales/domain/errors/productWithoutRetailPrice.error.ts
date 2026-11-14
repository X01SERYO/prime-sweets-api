import { DomainError } from '@/shared/domain/errors/domainError';

export class ProductWithoutRetailPriceError extends DomainError {
  readonly code = 'PRODUCT_WITHOUT_RETAIL_PRICE';

  constructor(productId: string) {
    super(`Product "${productId}" has no retail price`);
  }
}
