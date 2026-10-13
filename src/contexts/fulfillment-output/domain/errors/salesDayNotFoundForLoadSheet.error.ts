import { NotFoundError } from '../../../../shared/domain/errors/notFound.error';

export class SalesDayNotFoundForLoadSheetError extends NotFoundError {
  readonly code = 'SALES_DAY_NOT_FOUND';

  constructor(salesDayId: string) {
    super(`Sales Day "${salesDayId}" was not found`);
  }
}
