import { DomainError } from '../../../../shared/domain/errors/domainError';

export class DeliveryDateRequiredError extends DomainError {
  readonly code = 'DELIVERY_DATE_REQUIRED';

  constructor() {
    super('Delivery date is required');
  }
}
