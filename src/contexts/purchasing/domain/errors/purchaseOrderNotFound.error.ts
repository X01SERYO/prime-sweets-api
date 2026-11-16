import { NotFoundError } from '@/shared/domain/errors/notFound.error';

export class PurchaseOrderNotFoundError extends NotFoundError {
  readonly code = 'PURCHASE_ORDER_NOT_FOUND';

  constructor(id: string) {
    super(`Purchase order "${id}" was not found`);
  }
}
