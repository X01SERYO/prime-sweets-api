import { NotFoundError } from '../../../../shared/domain/errors/notFound.error';

export class SaleNotFoundForInvoiceError extends NotFoundError {
  readonly code = 'SALE_NOT_FOUND';

  constructor(saleId: string) {
    super(`Sale "${saleId}" was not found`);
  }
}
