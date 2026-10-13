import { DomainError } from '../../../../shared/domain/errors/domainError';

export class SaleNotInvoiceableError extends DomainError {
  readonly code = 'SALE_NOT_INVOICEABLE';

  constructor(saleId: string, status: string) {
    super(`Sale "${saleId}" cannot be invoiced while its status is ${status}`);
  }
}
