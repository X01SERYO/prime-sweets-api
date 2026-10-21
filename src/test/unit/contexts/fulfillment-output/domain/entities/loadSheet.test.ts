import test from 'node:test';
import assert from 'node:assert/strict';
import { LoadSheet } from '../../../../../../contexts/fulfillment-output/domain/entities/loadSheet';
import { ProductNotFoundForLoadSheetError } from '../../../../../../contexts/fulfillment-output/domain/errors/productNotFoundForLoadSheet.error';
import { LoadSheetProductNameMissingError } from '../../../../../../contexts/fulfillment-output/domain/errors/loadSheetProductNameMissing.error';

test('LoadSheet - aggregates different item contributions of the same product into one row', () => {
  const loadSheet = LoadSheet.compose({
    salesDayId: 'sd-1',
    contributions: [
      {
        productId: 'p-123',
        quantity: 10,
        wholesaleCost: 600,
        wholesaleSalePrice: 1000,
        totalPrice: 10000,
        profit: 4000
      },
      {
        productId: 'p-123',
        quantity: 5,
        wholesaleCost: 600,
        wholesaleSalePrice: 1000,
        totalPrice: 5000,
        profit: 2000
      }
    ],
    displays: [
      {
        productId: 'p-123',
        brand: 'Acme',
        name: 'Catalog Soda'
      }
    ]
  });

  const primitives = loadSheet.toPrimitives();

  assert.equal(primitives.lines.length, 1);
  assert.deepEqual(primitives.lines[0], {
    productId: 'p-123',
    brand: 'Acme',
    wholesaleCost: 600,
    wholesaleSalePrice: 1000,
    name: 'Catalog Soda',
    quantity: 15,
    totalPrice: 15000,
    profit: 6000
  });
});

test('LoadSheet - keeps one row when transaction-time unit prices differ and does not average them', () => {
  const loadSheet = LoadSheet.compose({
    salesDayId: 'sd-1',
    contributions: [
      {
        productId: 'p-1',
        quantity: 1,
        wholesaleCost: 40,
        wholesaleSalePrice: 100,
        totalPrice: 100,
        profit: 60
      },
      {
        productId: 'p-1',
        quantity: 1,
        wholesaleCost: 50,
        wholesaleSalePrice: 200,
        totalPrice: 200,
        profit: 150
      }
    ],
    displays: [{ productId: 'p-1', brand: null, name: 'Mixed' }]
  });

  const line = loadSheet.toPrimitives().lines[0];

  assert.equal(line.quantity, 2);
  assert.equal(line.totalPrice, 300);
  assert.equal(line.profit, 210);
  assert.equal(line.wholesaleCost, null);
  assert.equal(line.wholesaleSalePrice, null);
});

test('LoadSheet - uses the catalog name and ignores a missing product', () => {
  assert.throws(
    () =>
      LoadSheet.compose({
        salesDayId: 'sd-1',
        contributions: [
          {
            productId: 'missing',
            quantity: 1,
            wholesaleCost: 1,
            wholesaleSalePrice: 2,
            totalPrice: 2,
            profit: 1
          }
        ],
        displays: []
      }),
    ProductNotFoundForLoadSheetError
  );
});

test('LoadSheet - rejects a blank catalog name', () => {
  assert.throws(
    () =>
      LoadSheet.compose({
        salesDayId: 'sd-1',
        contributions: [
          {
            productId: 'p-1',
            quantity: 1,
            wholesaleCost: 1,
            wholesaleSalePrice: 2,
            totalPrice: 2,
            profit: 1
          }
        ],
        displays: [{ productId: 'p-1', brand: 'Acme', name: '   ' }]
      }),
    LoadSheetProductNameMissingError
  );
});

test('LoadSheet - sorts lines by brand, then catalog name, then productId', () => {
  const loadSheet = LoadSheet.compose({
    salesDayId: 'sd-1',
    contributions: [
      { productId: 'p-b', quantity: 1, wholesaleCost: 1, wholesaleSalePrice: 2, totalPrice: 2, profit: 1 },
      { productId: 'p-a2', quantity: 1, wholesaleCost: 1, wholesaleSalePrice: 2, totalPrice: 2, profit: 1 },
      { productId: 'p-a1', quantity: 1, wholesaleCost: 1, wholesaleSalePrice: 2, totalPrice: 2, profit: 1 }
    ],
    displays: [
      { productId: 'p-b', brand: null, name: 'Zed' },
      { productId: 'p-a2', brand: 'Acme', name: 'Beta' },
      { productId: 'p-a1', brand: 'Acme', name: 'Alpha' }
    ]
  });

  assert.deepEqual(
    loadSheet.toPrimitives().lines.map((line) => line.productId),
    ['p-a1', 'p-a2', 'p-b']
  );
});

test('LoadSheet - returns no lines when there are no contributions', () => {
  const loadSheet = LoadSheet.compose({
    salesDayId: 'sd-1',
    contributions: [],
    displays: []
  });

  assert.deepEqual(loadSheet.toPrimitives(), { salesDayId: 'sd-1', lines: [] });
});
