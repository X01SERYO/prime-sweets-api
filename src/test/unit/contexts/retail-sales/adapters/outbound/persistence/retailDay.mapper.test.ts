import test from 'node:test';
import assert from 'node:assert/strict';
import { RetailDay, RetailDayStatus } from '@/contexts/retail-sales/domain/entities/retailDay';
import { RetailDayMapper } from '@/contexts/retail-sales/adapters/outbound/persistence/retailDay.mapper';

const snapshot = {
  productId: 'prod-1',
  productCode: 'A12',
  brandName: 'Jet',
  productName: 'Chocolatina',
  retailPrice: 1500,
  retailCost: 1000,
};

test('RetailDayMapper stores the draft without derived line totals and restores them', () => {
  const day = RetailDay.create('day-1', '2026-11-14').addProduct(snapshot, 3, '2026-11-14');
  const entity = RetailDayMapper.toEntity(day);

  assert.equal(entity.openItems?.length, 1);
  assert.equal('totalPrice' in (entity.openItems?.[0] ?? {}), false);
  assert.equal(entity.totalAmount, '4500.00');
  assert.equal(entity.totalProfit, '1500.00');

  const restored = RetailDayMapper.toDomain(entity);
  assert.equal(restored.items[0].totalPrice, 4500);
  assert.equal(restored.items[0].profit, 1500);
  assert.equal(restored.totalAmount, 4500);
});

test('RetailDayMapper keeps persisted totals when the draft is gone', () => {
  const reviewed = RetailDay.create('day-1', '2026-11-14')
    .addProduct(snapshot, 2, '2026-11-14')
    .review('user-1', new Date('2026-11-14T18:00:00.000Z'));
  const entity = RetailDayMapper.toEntity(reviewed);

  assert.equal(entity.openItems, null);
  assert.equal(entity.status, RetailDayStatus.Reviewed);
  assert.equal(entity.reviewedBy, 'user-1');

  const restored = RetailDayMapper.toDomain(entity);
  assert.equal(restored.items.length, 0);
  assert.equal(restored.totalAmount, 3000);
  assert.equal(restored.status, RetailDayStatus.Reviewed);
});
