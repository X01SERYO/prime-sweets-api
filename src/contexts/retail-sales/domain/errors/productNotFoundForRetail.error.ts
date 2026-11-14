import { NotFoundError } from '@/shared/domain/errors/notFound.error';

export class ProductNotFoundForRetailError extends NotFoundError {
  readonly code = 'PRODUCT_NOT_FOUND_FOR_RETAIL';

  constructor(productId: string) {
    super(`Product "${productId}" was not found for a retail sale`);
  }
}
