import { NotFoundError } from '@/shared/domain/errors/notFound.error';

export class ProductNotFoundForPurchaseError extends NotFoundError {
  readonly code = 'PRODUCT_NOT_FOUND_FOR_PURCHASE';

  constructor(productId: string) {
    super(`Product "${productId}" was not found`);
  }
}
