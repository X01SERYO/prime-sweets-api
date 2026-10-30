import test from 'node:test';
import assert from 'node:assert/strict';
import { SaleItem } from '../../../../../../contexts/sales/domain/entities/saleItem';
import { InvalidSaleError } from '../../../../../../contexts/sales/domain/errors/invalidSale.error';
import { InvalidQuantityError } from '../../../../../../contexts/sales/domain/errors/invalidQuantity.error';

test('SaleItem entity - calculates totalPrice and profit accurately according to business formulas', () => {
  // quantity: 10, wholesalePrice: 1500, wholesaleCost: 1000
  // totalPrice = 10 * 1500 = 15000
  // profit = 15000 - (1000 * 10) = 5000
  const item = SaleItem.create({
    id: 'item-1',
    productId: 'prod-100',
    itemName: 'Galletas Chocolate',
    quantity: 10,
    wholesalePrice: 1500,
    wholesaleCost: 1000
  });

  assert.equal(item.id, 'item-1');
  assert.equal(item.productId, 'prod-100');
  assert.equal(item.itemName, 'Galletas Chocolate');
  assert.equal(item.quantity, 10);
  assert.equal(item.wholesalePrice, 1500);
  assert.equal(item.wholesaleCost, 1000);
  assert.equal(item.totalPrice, 15000);
  assert.equal(item.profit, 5000);

  const primitives = item.toPrimitives();
  assert.equal(primitives.totalPrice, 15000);
  assert.equal(primitives.profit, 5000);
});

test('SaleItem entity - updates quantity and recalculates totals', () => {
  const item = SaleItem.create({
    id: 'item-1',
    productId: 'prod-100',
    itemName: 'Galletas Chocolate',
    quantity: 2,
    wholesalePrice: 1500,
    wholesaleCost: 1000
  });

  assert.equal(item.totalPrice, 3000);
  assert.equal(item.profit, 1000);

  const updated = item.updateQuantity(5);
  assert.equal(updated.quantity, 5);
  assert.equal(updated.totalPrice, 7500);
  assert.equal(updated.profit, 2500);
});

test('SaleItem entity - updates transaction-time itemName', () => {
  const item = SaleItem.create({
    id: 'item-1',
    productId: 'prod-100',
    itemName: 'Galletas Original',
    quantity: 1,
    wholesalePrice: 1000,
    wholesaleCost: 800
  });

  const updated = item.updateItemName('Galletas Edición Especial');
  assert.equal(updated.itemName, 'Galletas Edición Especial');
  assert.equal(updated.productId, 'prod-100'); // productId remains unchanged
});

test('SaleItem entity - accepts a decimal quantity and rejects zero or negative', () => {
  assert.throws(
    () =>
      SaleItem.create({
        id: '1',
        productId: 'p1',
        itemName: 'Name',
        quantity: 0,
        wholesalePrice: 100,
        wholesaleCost: 50
      }),
    InvalidQuantityError
  );

  assert.throws(
    () =>
      SaleItem.create({
        id: '1',
        productId: 'p1',
        itemName: 'Name',
        quantity: -5,
        wholesalePrice: 100,
        wholesaleCost: 50
      }),
    InvalidQuantityError
  );

  const decimal = SaleItem.create({
    id: '1',
    productId: 'p1',
    itemName: 'Name',
    quantity: 1.5,
    wholesalePrice: 100,
    wholesaleCost: 50
  });
  assert.equal(decimal.quantity, 1.5);
  assert.equal(decimal.totalPrice, 150);
});

test('SaleItem entity - validates prices, costs and mandatory fields', () => {
  assert.throws(
    () =>
      SaleItem.create({
        id: '',
        productId: 'p1',
        itemName: 'Name',
        quantity: 1,
        wholesalePrice: 100,
        wholesaleCost: 50
      }),
    InvalidSaleError
  );

  assert.throws(
    () =>
      SaleItem.create({
        id: '1',
        productId: 'p1',
        itemName: '   ',
        quantity: 1,
        wholesalePrice: 100,
        wholesaleCost: 50
      }),
    InvalidSaleError
  );

  assert.throws(
    () =>
      SaleItem.create({
        id: '1',
        productId: 'p1',
        itemName: 'Name',
        quantity: 1,
        wholesalePrice: -10,
        wholesaleCost: 50
      }),
    InvalidSaleError
  );

  assert.throws(
    () =>
      SaleItem.create({
        id: '1',
        productId: 'p1',
        itemName: 'Name',
        quantity: 1,
        wholesalePrice: 100,
        wholesaleCost: -5
      }),
    InvalidSaleError
  );
});
