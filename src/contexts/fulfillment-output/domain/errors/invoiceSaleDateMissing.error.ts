import { DomainError } from '../../../../shared/domain/errors/domainError';

export class InvoiceSaleDateMissingError extends DomainError {
  readonly code = 'INVOICE_SALE_DATE_MISSING';

  constructor(saleId: string) {
    super(`Confirmed sale "${saleId}" has no confirmation date`);
  }
}
