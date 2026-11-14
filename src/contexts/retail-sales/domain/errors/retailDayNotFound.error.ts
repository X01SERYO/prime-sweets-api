import { NotFoundError } from '@/shared/domain/errors/notFound.error';

export class RetailDayNotFoundError extends NotFoundError {
  readonly code = 'RETAIL_DAY_NOT_FOUND';
  readonly dates: string[];

  constructor(dates: string | string[]) {
    const list = Array.isArray(dates) ? dates : [dates];
    super(list.length === 1 ? `Retail day "${list[0]}" was not found` : `Retail days were not found: ${list.join(', ')}`);
    this.dates = list;
  }
}
