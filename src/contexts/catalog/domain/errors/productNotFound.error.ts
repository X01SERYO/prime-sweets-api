import { NotFoundError } from '../../../../shared/domain/errors/notFound.error';

export class ProductNotFoundError extends NotFoundError {
  readonly code = 'PRODUCT_NOT_FOUND';

  constructor(id: string) {
    super(`Product "${id}" was not found`);
  }
}
