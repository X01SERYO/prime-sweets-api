import { DeliveryDateOutOfRangeError } from '../errors/deliveryDateOutOfRange.error';
import { DeliveryDateRequiredError } from '../errors/deliveryDateRequired.error';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function normalizeBusinessDate(value: string): string {
  const trimmed = value?.trim() ?? '';
  if (!DATE_REGEX.test(trimmed)) {
    throw new DeliveryDateRequiredError();
  }
  const [year, month, day] = trimmed.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new DeliveryDateRequiredError();
  }
  return trimmed;
}

export function sundayOf(businessDate: string): string {
  const [year, month, day] = normalizeBusinessDate(businessDate).split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const weekday = date.getUTCDay();
  date.setUTCDate(date.getUTCDate() + (weekday === 0 ? 0 : 7 - weekday));
  return date.toISOString().slice(0, 10);
}

export function assertDeliveryDateAllowed(deliveryDate: string, today: string): string {
  const date = normalizeBusinessDate(deliveryDate);
  if (date < today || date > sundayOf(today)) {
    throw new DeliveryDateOutOfRangeError(date, today, sundayOf(today));
  }
  return date;
}
