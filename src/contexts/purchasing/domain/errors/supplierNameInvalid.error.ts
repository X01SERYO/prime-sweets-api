import { DomainError } from '@/shared/domain/errors/domainError';

export class SupplierNameInvalidError extends DomainError {
  readonly code = 'SUPPLIER_NAME_INVALID';

  constructor(message = 'Supplier name must be 1 to 120 characters') {
    super(message);
  }
}
