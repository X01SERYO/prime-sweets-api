import { NotFoundError } from '../../../../shared/domain/errors/notFound.error';

export class ProductNotFoundForLoadSheetError extends NotFoundError {
  readonly code = 'PRODUCT_NOT_FOUND';

  constructor(productId: string) {
    super(`Product "${productId}" was not found in catalog`);
  }
}
