import { DomainError } from '../../../../shared/domain/errors/domainError';

export class AlegraRequestError extends DomainError {
  readonly code = 'ALEGRA_REQUEST_FAILED';

  constructor(status: number, body: string) {
    super(`Alegra request failed with status ${status}: ${body}`);
  }
}
