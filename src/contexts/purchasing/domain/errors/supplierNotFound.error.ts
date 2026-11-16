import { NotFoundError } from '@/shared/domain/errors/notFound.error';

export class SupplierNotFoundError extends NotFoundError {
  readonly code = 'SUPPLIER_NOT_FOUND';

  constructor(id: string) {
    super(`Supplier "${id}" was not found`);
  }
}
