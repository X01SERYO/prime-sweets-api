import { InvalidSalesDayError } from './errors/invalidSalesDay.error';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export type CurrentWeekBounds = {
  weekStart: string;
  through: string;
};

export function currentWeekBounds(currentDate: string): CurrentWeekBounds {
  const today = parseBusinessDate(currentDate);
  const weekday = today.getUTCDay();
  const daysFromMonday = weekday === 0 ? 6 : weekday - 1;
  const monday = new Date(today);
  monday.setUTCDate(monday.getUTCDate() - daysFromMonday);

  return {
    weekStart: formatBusinessDate(monday),
    through: formatBusinessDate(today)
  };
}

export function isInsideEditWindow(salesDayDate: string, today: string): boolean {
  const bounds = currentWeekBounds(today);
  const day = formatBusinessDate(parseBusinessDate(salesDayDate));
  return day >= bounds.weekStart && day <= bounds.through;
}

function parseBusinessDate(value: string): Date {
  const trimmed = value?.trim() ?? '';
  if (!DATE_REGEX.test(trimmed)) {
    throw new InvalidSalesDayError(`Sales Day date must be in YYYY-MM-DD format (received "${value}")`);
  }

  const [year, month, day] = trimmed.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new InvalidSalesDayError(`Sales Day date must be in YYYY-MM-DD format (received "${value}")`);
  }

  return date;
}

function formatBusinessDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
