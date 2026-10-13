import { NotFoundError } from '../../../../shared/domain/errors/notFound.error';

export class SalesDayNotFoundError extends NotFoundError {
  readonly code = 'SALES_DAY_NOT_FOUND';

  constructor(identifier: string) {
    super(`Sales Day "${identifier}" was not found`);
  }
}
