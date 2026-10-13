import { DomainError } from '../../../../shared/domain/errors/domainError';

export class LoadSheetProductNameMissingError extends DomainError {
  readonly code = 'LOAD_SHEET_PRODUCT_NAME_MISSING';

  constructor(productId: string) {
    super(`Catalog product "${productId}" has no name for the Load Sheet`);
  }
}
