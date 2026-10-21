import test from 'node:test';
import assert from 'node:assert/strict';
import { SalesDay } from '../../../../../../contexts/sales-day/domain/entities/salesDay';
import { InvalidSalesDayError } from '../../../../../../contexts/sales-day/domain/errors/invalidSalesDay.error';
import { SalesDayAlreadyClosedError } from '../../../../../../contexts/sales-day/domain/errors/salesDayAlreadyClosedError';
import { SalesDayAlreadyOpenError } from '../../../../../../contexts/sales-day/domain/errors/salesDayAlreadyOpenError';
import { SalesDayCannotBeReopenedError } from '../../../../../../contexts/sales-day/domain/errors/salesDayCannotBeReopenedError';

test('SalesDay entity - creates open SalesDay instance by default', () => {
  const salesDay = SalesDay.create({
    id: 'sd-001',
    sellerId: 'seller-100',
    date: '2026-10-13'
  });

  assert.equal(salesDay.id, 'sd-001');
  assert.equal(salesDay.sellerId, 'seller-100');
  assert.equal(salesDay.date, '2026-10-13');
  assert.equal(salesDay.status, 'OPEN');
  assert.equal(salesDay.isOpen(), true);
  assert.equal(salesDay.isClosed(), false);
  assert.equal(salesDay.closedAt, null);
  assert.ok(salesDay.openedAt);

  const primitives = salesDay.toPrimitives();
  assert.equal(primitives.status, 'OPEN');
  assert.equal(primitives.closedAt, null);
});

test('SalesDay entity - validates mandatory fields and date format', () => {
  assert.throws(
    () => SalesDay.create({ id: '', sellerId: 'seller-1', date: '2026-10-13' }),
    InvalidSalesDayError
  );
  assert.throws(
    () => SalesDay.create({ id: 'sd-1', sellerId: '   ', date: '2026-10-13' }),
    InvalidSalesDayError
  );
  assert.throws(
    () => SalesDay.create({ id: 'sd-1', sellerId: 'seller-1', date: '13-10-2026' }),
    InvalidSalesDayError
  );
  assert.throws(
    () => SalesDay.create({ id: 'sd-1', sellerId: 'seller-1', date: 'invalid-date' }),
    InvalidSalesDayError
  );
});

test('SalesDay entity - closes open SalesDay and records closedAt', () => {
  const salesDay = SalesDay.create({
    id: 'sd-001',
    sellerId: 'seller-100',
    date: '2026-10-13'
  });

  const closed = salesDay.close();

  assert.equal(closed.status, 'CLOSED');
  assert.equal(closed.isOpen(), false);
  assert.equal(closed.isClosed(), true);
  assert.ok(closed.closedAt);

  // Closing already closed day fails
  assert.throws(() => closed.close(), SalesDayAlreadyClosedError);
});

test('SalesDay entity - reopens current calendar day SalesDay', () => {
  const salesDay = SalesDay.create({
    id: 'sd-001',
    sellerId: 'seller-100',
    date: '2026-10-13'
  }).close();

  assert.equal(salesDay.isClosed(), true);

  const reopened = salesDay.reopen('2026-10-13');

  assert.equal(reopened.status, 'OPEN');
  assert.equal(reopened.isOpen(), true);
  assert.equal(reopened.closedAt, null);

  // Reopening already open day fails
  assert.throws(() => reopened.reopen('2026-10-13'), SalesDayAlreadyOpenError);
});

test('SalesDay entity - rejects reopening historical SalesDay', () => {
  const yesterdayDay = SalesDay.create({
    id: 'sd-001',
    sellerId: 'seller-100',
    date: '2026-10-12'
  }).close();

  assert.throws(
    () => yesterdayDay.reopen('2026-10-13'),
    SalesDayCannotBeReopenedError
  );
});
