import { NotFoundError } from '../../../../shared/domain/errors/notFound.error';

export class ProductNotFoundForSaleError extends NotFoundError {
  readonly code = 'PRODUCT_NOT_FOUND';

  constructor(productId: string) {
    super(`Product "${productId}" was not found in catalog`);
  }
}
