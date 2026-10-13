import { DomainError } from '../../../../shared/domain/errors/domainError';

export class SaleAlreadyVoidedError extends DomainError {
  readonly code = 'SALE_ALREADY_VOIDED';

  constructor(id: string) {
    super(`Sale "${id}" is already voided and cannot be modified`);
  }
}
