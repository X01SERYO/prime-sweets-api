import { DomainError } from '../../../../shared/domain/errors/domainError';

export class BrandAlreadyExistsError extends DomainError {
  readonly code = 'BRAND_ALREADY_EXISTS';

  constructor(field: string, value: string) {
    super(`Brand ${field} "${value}" already exists`);
  }
}
