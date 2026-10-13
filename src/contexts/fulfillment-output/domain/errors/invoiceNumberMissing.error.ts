import { DomainError } from '../../../../shared/domain/errors/domainError';

export class InvoiceNumberMissingError extends DomainError {
  readonly code = 'INVOICE_NUMBER_MISSING';

  constructor(saleId: string) {
    super(`Confirmed sale "${saleId}" has no invoice number`);
  }
}
