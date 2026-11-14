import test from 'node:test';
import assert from 'node:assert/strict';
import { RetailDay } from '@/contexts/retail-sales/domain/entities/retailDay';
import { RetailDayItem, type RetailProductSnapshot } from '@/contexts/retail-sales/domain/entities/retailDayItem';
import { InvalidRetailQuantityError } from '@/contexts/retail-sales/domain/errors/invalidRetailQuantity.error';
import { ProductWithoutRetailPriceError } from '@/contexts/retail-sales/domain/errors/productWithoutRetailPrice.error';
import { RetailDayAlreadyReviewedError } from '@/contexts/retail-sales/domain/errors/retailDayAlreadyReviewed.error';
import { RetailDayClosedError } from '@/contexts/retail-sales/domain/errors/retailDayClosed.error';
import { RetailItemNotFoundError } from '@/contexts/retail-sales/domain/errors/retailItemNotFound.error';

const today = '2026-11-14';

const chocolate: RetailProductSnapshot = {
  productId: 'prod-1',
  productCode: 'A12',
  brandName: 'Jet',
  productName: 'Chocolatina',
  retailPrice: 1500,
  retailCost: 1000,
};

const peanuts: RetailProductSnapshot = {
  productId: 'prod-2',
  productCode: 'B07',
  brandName: 'Jumbo',
  productName: 'Maní',
  retailPrice: 2000,
  retailCost: null,
};

test('RetailDay starts empty and unreviewed', () => {
  const day = RetailDay.create('day-1', today);
  assert.equal(day.status, 'UNREVIEWED');
  assert.equal(day.items.length, 0);
  assert.equal(day.totalAmount, 0);
  assert.equal(day.totalProfit, 0);
  assert.equal(day.isEditable(today), true);
});

test('adding a product snapshots price and computes totals', () => {
  const day = RetailDay.create('day-1', today).addProduct(chocolate, 3, today);
  const item = day.items[0];
  assert.equal(item.quantity, 3);
  assert.equal(item.retailPrice, 1500);
  assert.equal(item.totalPrice, 4500);
  assert.equal(item.profit, 1500);
  assert.equal(day.totalAmount, 4500);
  assert.equal(day.totalProfit, 1500);
});

test('adding the same product increases quantity at the frozen price', () => {
  const day = RetailDay.create('day-1', today)
    .addProduct(chocolate, 3, today)
    .addProduct({ ...chocolate, retailPrice: 9999, retailCost: 1 }, 2, today);
  assert.equal(day.items.length, 1);
  assert.equal(day.items[0].quantity, 5);
  assert.equal(day.items[0].retailPrice, 1500);
  assert.equal(day.totalAmount, 7500);
  assert.equal(day.totalProfit, 2500);
});

test('setQuantity recomputes the line and both totals', () => {
  const day = RetailDay.create('day-1', today)
    .addProduct(chocolate, 3, today)
    .setQuantity('prod-1', 4, today);
  assert.equal(day.items[0].quantity, 4);
  assert.equal(day.totalAmount, 6000);
  assert.equal(day.totalProfit, 2000);
});

test('quantity 0, negative, and non-integer values are rejected', () => {
  const day = RetailDay.create('day-1', today).addProduct(chocolate, 1, today);
  for (const quantity of [0, -1, 1.5]) {
    assert.throws(() => day.addProduct(peanuts, quantity, today), InvalidRetailQuantityError);
    assert.throws(() => day.setQuantity('prod-1', quantity, today), InvalidRetailQuantityError);
  }
});

test('removing a row recomputes totals', () => {
  const day = RetailDay.create('day-1', today).addProduct(chocolate, 2, today).addProduct(peanuts, 1, today);
  const { day: next, becameEmpty } = day.removeItem('prod-1', today);
  assert.equal(becameEmpty, false);
  assert.equal(next.items.length, 1);
  assert.equal(next.totalAmount, 2000);
  assert.equal(next.totalProfit, 0);
});

test('removing the last product marks the day empty', () => {
  const day = RetailDay.create('day-1', today).addProduct(chocolate, 2, today);
  const { day: next, becameEmpty } = day.removeItem('prod-1', today);
  assert.equal(becameEmpty, true);
  assert.equal(next.items.length, 0);
  assert.equal(next.totalAmount, 0);
});

test('a missing row cannot be changed or removed', () => {
  const day = RetailDay.create('day-1', today).addProduct(chocolate, 1, today);
  assert.throws(() => day.setQuantity('missing', 1, today), RetailItemNotFoundError);
  assert.throws(() => day.removeItem('missing', today), RetailItemNotFoundError);
});

test('a product without a retail price or with price 0 is rejected', () => {
  const day = RetailDay.create('day-1', today);
  assert.throws(
    () => day.addProduct({ ...peanuts, retailPrice: 0 }, 1, today),
    ProductWithoutRetailPriceError
  );
});

test('a product without retail cost is added with profit 0', () => {
  const day = RetailDay.create('day-1', today).addProduct(peanuts, 2, today);
  assert.equal(day.items[0].hasCost, false);
  assert.equal(day.items[0].profit, 0);
  assert.equal(day.totalAmount, 4000);
  assert.equal(day.totalProfit, 0);
});

test('a day that is not today cannot be edited', () => {
  const day = RetailDay.create('day-1', '2026-11-13');
  assert.throws(() => day.addProduct(chocolate, 1, today), RetailDayClosedError);
});

test('compaction drops items and keeps totals, and a second run changes nothing', () => {
  const open = RetailDay.create('day-1', '2026-11-13').addProduct(chocolate, 2, '2026-11-13');
  const once = open.compact();
  const twice = once.compact();
  assert.equal(once.items.length, 0);
  assert.equal(once.totalAmount, open.totalAmount);
  assert.equal(once.totalProfit, open.totalProfit);
  assert.equal(once.status, 'UNREVIEWED');
  assert.equal(twice.totalAmount, once.totalAmount);
  assert.equal(twice.items.length, 0);
});

test('reviewing sets status and discards detail; a second review is rejected', () => {
  const open = RetailDay.create('day-1', today).addProduct(chocolate, 2, today);
  const reviewedAt = new Date('2026-11-14T18:00:00.000Z');
  const reviewed = open.review('user-1', reviewedAt);
  assert.equal(reviewed.status, 'REVIEWED');
  assert.equal(reviewed.reviewedBy, 'user-1');
  assert.equal(reviewed.reviewedAt?.toISOString(), reviewedAt.toISOString());
  assert.equal(reviewed.items.length, 0);
  assert.equal(reviewed.totalAmount, 3000);
  assert.equal(reviewed.totalProfit, 1000);
  assert.throws(() => reviewed.review('user-2', reviewedAt), RetailDayAlreadyReviewedError);
  assert.throws(() => reviewed.addProduct(chocolate, 1, today), RetailDayClosedError);
});

test('a rehydrated past day keeps persisted totals with no items', () => {
  const day = RetailDay.rehydrate({
    id: 'day-1',
    businessDate: '2026-11-01',
    status: 'UNREVIEWED',
    items: [],
    totalAmount: 64000,
    totalProfit: 15200,
    reviewedAt: null,
    reviewedBy: null,
  });
  assert.equal(day.totalAmount, 64000);
  assert.equal(day.items.length, 0);
  assert.equal(day.isEditable(today), false);
  const reviewed = day.review('user-9', new Date('2026-11-14T12:00:00.000Z'));
  assert.equal(reviewed.totalAmount, 64000);
  assert.equal(reviewed.status, 'REVIEWED');
});

test('line money is rounded to 2 decimals before summing', () => {
  const item = RetailDayItem.fromSnapshot(
    { ...chocolate, retailPrice: 10.005, retailCost: 3.333 },
    1
  );
  assert.equal(item.totalPrice, 10.01);
  assert.equal(item.profit, 6.67);
});
