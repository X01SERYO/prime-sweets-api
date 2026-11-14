import { DomainError } from '@/shared/domain/errors/domainError';

export class RetailItemNotFoundError extends DomainError {
  readonly code = 'RETAIL_ITEM_NOT_FOUND';

  constructor(productId: string) {
    super(`Retail item for product "${productId}" was not found`);
  }
}
