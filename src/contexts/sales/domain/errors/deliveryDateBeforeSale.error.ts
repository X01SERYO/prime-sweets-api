import { DomainError } from '../../../../shared/domain/errors/domainError';

export class DeliveryDateBeforeSaleError extends DomainError {
  readonly code = 'DELIVERY_DATE_BEFORE_SALE';

  constructor() {
    super('Delivery date cannot be before the sales day');
  }
}
