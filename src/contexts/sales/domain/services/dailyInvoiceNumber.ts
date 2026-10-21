import { InvalidSaleError } from '../errors/invalidSale.error';

export function formatDailyInvoiceNumber(value: number): string {
  if (!Number.isInteger(value) || value < 1) {
    throw new InvalidSaleError('Invoice sequence value must be a positive integer');
  }

  return value < 1000 ? String(value).padStart(3, '0') : String(value);
}
