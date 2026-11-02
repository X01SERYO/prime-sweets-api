import { DomainError } from '../../../../shared/domain/errors/domainError';

export class ProductAlegraSyncError extends DomainError {
  readonly code = 'ALEGRA_SYNC_FAILED';

  constructor(reason: string) {
    super(reason);
  }
}
