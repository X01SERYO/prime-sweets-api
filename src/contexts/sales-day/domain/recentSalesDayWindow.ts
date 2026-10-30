import { InvalidSalesDayError } from './errors/invalidSalesDay.error';

export const RECENT_SALES_DAY_LIMIT = 7;

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function recentSalesDayStart(currentDate: string, limit = RECENT_SALES_DAY_LIMIT): string {
  const trimmed = currentDate?.trim() ?? '';
  if (!DATE_REGEX.test(trimmed) || limit < 1) {
    throw new InvalidSalesDayError(`Sales Day date must be in YYYY-MM-DD format (received "${currentDate}")`);
  }

  const [year, month, day] = trimmed.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new InvalidSalesDayError(`Sales Day date must be in YYYY-MM-DD format (received "${currentDate}")`);
  }

  date.setUTCDate(date.getUTCDate() - (limit - 1));
  return date.toISOString().slice(0, 10);
}
