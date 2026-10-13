import { NotFoundError } from '../../../../shared/domain/errors/notFound.error';

export class SaleNotFoundError extends NotFoundError {
  readonly code = 'SALE_NOT_FOUND';

  constructor(id: string) {
    super(`Sale "${id}" was not found`);
  }
}
