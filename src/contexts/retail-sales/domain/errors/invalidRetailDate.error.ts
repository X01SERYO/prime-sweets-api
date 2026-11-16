import { DomainError } from '@/shared/domain/errors/domainError';

export class InvalidRetailDateError extends DomainError {
  readonly code = 'INVALID_RETAIL_DATE';

  constructor(date: string) {
    super(`Retail date "${date}" is not allowed`);
  }
}
