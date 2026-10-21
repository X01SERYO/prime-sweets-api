import test from 'node:test';
import assert from 'node:assert/strict';
import { formatDailyInvoiceNumber } from '../../../../../../contexts/sales/domain/services/dailyInvoiceNumber';
import { InvalidSaleError } from '../../../../../../contexts/sales/domain/errors/invalidSale.error';

test('formatDailyInvoiceNumber - pads the first numbers of the day to three digits', () => {
  assert.equal(formatDailyInvoiceNumber(1), '001');
  assert.equal(formatDailyInvoiceNumber(12), '012');
  assert.equal(formatDailyInvoiceNumber(999), '999');
});

test('formatDailyInvoiceNumber - keeps every digit after 999', () => {
  assert.equal(formatDailyInvoiceNumber(1000), '1000');
});

test('formatDailyInvoiceNumber - rejects a non positive sequence value', () => {
  assert.throws(() => formatDailyInvoiceNumber(0), InvalidSaleError);
});
