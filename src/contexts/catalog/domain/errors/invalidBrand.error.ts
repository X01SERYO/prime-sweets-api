import { DomainError } from '../../../../shared/domain/errors/domainError';

export class InvalidBrandError extends DomainError {
  readonly code = 'BRAND_INVALID';

  constructor(message: string) {
    super(message);
  }
}
