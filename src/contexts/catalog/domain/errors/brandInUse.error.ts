import { DomainError } from '../../../../shared/domain/errors/domainError';

export class BrandInUseError extends DomainError {
  readonly code = 'BRAND_IN_USE';

  constructor(id: string) {
    super(`Brand "${id}" cannot be deleted because it has products`);
  }
}
