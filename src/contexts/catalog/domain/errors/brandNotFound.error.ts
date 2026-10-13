import { NotFoundError } from '../../../../shared/domain/errors/notFound.error';

export class BrandNotFoundError extends NotFoundError {
  readonly code = 'BRAND_NOT_FOUND';

  constructor(id: string) {
    super(`Brand "${id}" was not found`);
  }
}
