import { NotFoundError } from '../../../../shared/domain/errors/notFound.error';

export class CustomerNotFoundForInvoiceError extends NotFoundError {
  readonly code = 'CUSTOMER_NOT_FOUND';

  constructor(customerId: string) {
    super(`Customer "${customerId}" was not found`);
  }
}
