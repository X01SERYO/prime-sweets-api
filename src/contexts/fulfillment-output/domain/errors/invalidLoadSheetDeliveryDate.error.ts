import { DomainError } from '../../../../shared/domain/errors/domainError';

export class InvalidLoadSheetDeliveryDateError extends DomainError {
  readonly code = 'INVALID_DELIVERY_DATE';

  constructor() {
    super('Load Sheet delivery date must be YYYY-MM-DD');
  }
}
