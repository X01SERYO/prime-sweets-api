import { DomainError } from '../../../../shared/domain/errors/domainError';

export class CustomerAlreadyExistsError extends DomainError {
  readonly code = 'CUSTOMER_ALREADY_EXISTS';

  constructor(documentNumber: string) {
    super(`Customer with document number "${documentNumber}" already exists`);
  }
}
