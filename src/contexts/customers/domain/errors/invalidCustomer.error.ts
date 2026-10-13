import { DomainError } from '../../../../shared/domain/errors/domainError';

export class InvalidCustomerError extends DomainError {
  readonly code = 'CUSTOMER_INVALID';

  constructor(message: string) {
    super(message);
  }
}
