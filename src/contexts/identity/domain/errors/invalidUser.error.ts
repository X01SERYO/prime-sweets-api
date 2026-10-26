import { DomainError } from '../../../../shared/domain/errors/domainError';

export class InvalidUserError extends DomainError {
  readonly code = 'USER_INVALID';

  constructor(message: string) {
    super(message);
  }
}
