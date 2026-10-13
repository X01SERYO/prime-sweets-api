import { DomainError } from '../../../../shared/domain/errors/domainError';

export class CompanyProfileNotConfiguredError extends DomainError {
  readonly code = 'COMPANY_PROFILE_NOT_CONFIGURED';

  constructor() {
    super('Company profile is not configured');
  }
}
