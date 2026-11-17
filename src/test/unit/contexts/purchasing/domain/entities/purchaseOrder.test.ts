import test from 'node:test';
import assert from 'node:assert/strict';
import { PurchaseOrder, lineCost } from '@/contexts/purchasing/domain/entities/purchaseOrder';
import { Supplier } from '@/contexts/purchasing/domain/entities/supplier';
import { InvalidPurchaseQuantityError } from '@/contexts/purchasing/domain/errors/invalidPurchaseQuantity.error';
import { ProductWithoutCostError } from '@/contexts/purchasing/domain/errors/productWithoutCost.error';
import { PurchaseLineNameInvalidError } from '@/contexts/purchasing/domain/errors/purchaseLineNameInvalid.error';
import { PurchaseOrderEmptyError } from '@/contexts/purchasing/domain/errors/purchaseOrderEmpty.error';
import { SupplierNameInvalidError } from '@/contexts/purchasing/domain/errors/supplierNameInvalid.error';

const createdAt = new Date('2026-11-16T12:00:00.000Z');

const chocolate = {
  productId: 'prod-1',
  productCode: 'A12',
  brandName: 'Jet',
  catalogName: 'Chocolatina',
  itemName: 'Chocolatina fresa',
  unitCost: 800.5,
  quantity: 2
};

test('a supplier name is trimmed and a blank name is rejected', () => {
  const supplier = Supplier.create('sup-1', '  Dulces Norte  ');
  assert.equal(supplier.name, 'Dulces Norte');
  assert.throws(() => supplier.rename('   '), SupplierNameInvalidError);
  assert.throws(() => Supplier.create('sup-2', 'x'.repeat(121)), SupplierNameInvalidError);
});

test('linking a product twice keeps one link and unlink drops its last quantity', () => {
  const supplier = Supplier.create('sup-1', 'Norte');
  supplier.linkProduct('prod-1');
  supplier.linkProduct('prod-1');
  supplier.linkProduct('prod-2');
  supplier.applySavedLines([{ productId: 'prod-1', quantity: 4, unitCost: 10, itemName: 'CHOCOLATINA menta' }]);
  assert.equal(supplier.products.find(link => link.productId === 'prod-1')?.lastQuantity, 4);
  assert.equal(supplier.products.find(link => link.productId === 'prod-1')?.lastItemName, 'CHOCOLATINA menta');
  assert.equal(supplier.products.find(link => link.productId === 'prod-2')?.lastQuantity, null);
  supplier.applySavedLines([{ productId: 'prod-1', quantity: 9, unitCost: 10, itemName: 'CHOCOLATINA menta' }]);
  assert.equal(supplier.products.find(link => link.productId === 'prod-1')?.previousQuantity, 4);
  assert.equal(supplier.products.find(link => link.productId === 'prod-1')?.lastQuantity, 9);
  supplier.applySavedLines([{ productId: 'prod-1', quantity: 7, unitCost: 10, itemName: 'CHOCOLATINA menta' }], false);
  assert.equal(supplier.products.find(link => link.productId === 'prod-1')?.previousQuantity, 4);
  assert.equal(supplier.products.find(link => link.productId === 'prod-1')?.lastQuantity, 7);
  supplier.applySavedLines([
    { productId: 'prod-1', quantity: 2, unitCost: 10, itemName: 'CHOCOLATINA fresa' },
    { productId: 'prod-1', quantity: 5, unitCost: 10, itemName: 'CHOCOLATINA mora' }
  ], false);
  assert.deepEqual(
    supplier.products.find(link => link.productId === 'prod-1')?.items.map(item => item.itemName),
    ['CHOCOLATINA menta', 'CHOCOLATINA fresa', 'CHOCOLATINA mora']
  );
  supplier.rememberItems([{ productId: 'prod-1', itemName: 'CHOCOLATINA limón' }]);
  assert.equal(supplier.products.find(link => link.productId === 'prod-1')?.items.length, 4);
  supplier.unlinkProduct('prod-1');
  assert.deepEqual(
    supplier.products.map(link => link.productId),
    ['prod-2']
  );
});

test('a saved order keeps the catalog name and the extra, and the same name adds quantity', () => {
  const order = PurchaseOrder.create(
    'po-1',
    'sup-1',
    [
      chocolate,
      { ...chocolate, quantity: 1 },
      { ...chocolate, productId: 'prod-2', quantity: 1, itemName: 'Maní', catalogName: 'Maní', unitCost: 100 }
    ],
    createdAt
  );
  assert.equal(order.lines[0]?.catalogName, 'CHOCOLATINA');
  assert.equal(order.lines[0]?.itemName, 'CHOCOLATINA Fresa');
  assert.equal(order.lines[0]?.quantity, 3);
  assert.equal(lineCost(order.lines[0]!), 2401.5);
  assert.equal(order.totalCost, 2501.5);
  assert.equal(order.lineCount, 2);
  assert.equal(order.hasLines, true);
});

test('dropping lines keeps the total', () => {
  const order = PurchaseOrder.create('po-1', 'sup-1', [chocolate], createdAt);
  order.dropLines();
  assert.equal(order.hasLines, false);
  assert.equal(order.lines.length, 0);
  assert.equal(order.lineCount, 1);
  assert.equal(order.totalCost, 1601);
});

test('an empty order, a bad quantity, a missing cost, and a blank name are rejected', () => {
  assert.throws(() => PurchaseOrder.create('po-1', 'sup-1', [], createdAt), PurchaseOrderEmptyError);
  assert.throws(
    () => PurchaseOrder.create('po-1', 'sup-1', [{ ...chocolate, quantity: 0 }], createdAt),
    InvalidPurchaseQuantityError
  );
  assert.throws(
    () => PurchaseOrder.create('po-1', 'sup-1', [{ ...chocolate, unitCost: 0 }], createdAt),
    ProductWithoutCostError
  );
  assert.throws(
    () => PurchaseOrder.create('po-1', 'sup-1', [{ ...chocolate, catalogName: '  ', itemName: '  ' }], createdAt),
    PurchaseLineNameInvalidError
  );
});
