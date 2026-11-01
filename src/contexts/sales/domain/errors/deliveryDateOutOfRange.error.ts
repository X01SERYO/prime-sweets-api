import { DomainError } from '../../../../shared/domain/errors/domainError';

export class DeliveryDateOutOfRangeError extends DomainError {
  readonly code = 'DELIVERY_DATE_OUT_OF_RANGE';

  constructor(deliveryDate: string, from: string, to: string) {
    super(`Delivery date ${deliveryDate} must be between ${from} and ${to}`);
  }
}
