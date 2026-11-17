import test from 'node:test';
import assert from 'node:assert/strict';
import { PurchaseOrder } from '@/contexts/purchasing/domain/entities/purchaseOrder';
import { Supplier } from '@/contexts/purchasing/domain/entities/supplier';
import { PurchaseOrderMapper } from '@/contexts/purchasing/adapters/outbound/persistence/purchaseOrder.mapper';
import { SupplierMapper } from '@/contexts/purchasing/adapters/outbound/persistence/supplier.mapper';

const createdAt = new Date('2026-11-16T12:00:00.000Z');

test('a purchase order round-trips and a dropped detail stays null', () => {
  const order = PurchaseOrder.create(
    'po-1',
    'sup-1',
    [
      {
        productId: 'prod-1',
        productCode: 'A12',
        brandName: 'Jet',
        catalogName: 'Chocolatina',
        itemName: 'Chocolatina fresa',
        unitCost: 800.5,
        quantity: 2
      }
    ],
    createdAt
  );

  const stored = PurchaseOrderMapper.toDomain(PurchaseOrderMapper.toEntity(order));
  assert.equal(stored.lines[0]?.itemName, 'CHOCOLATINA Fresa');
  assert.equal(stored.totalCost, 1601);
  assert.equal(stored.createdAt.toISOString(), createdAt.toISOString());

  order.dropLines();
  const compacted = PurchaseOrderMapper.toEntity(order);
  assert.equal(compacted.lines, null);
  assert.equal(compacted.totalCost, 1601);
});

test('a supplier round-trips its last item name', () => {
  const supplier = Supplier.create('sup-1', 'Norte');
  supplier.linkProduct('prod-1');
  supplier.applySavedLines([{ productId: 'prod-1', quantity: 4, unitCost: 10, itemName: 'CHOCOLATINA menta' }]);

  const stored = SupplierMapper.toDomain(SupplierMapper.toEntity(supplier), SupplierMapper.toProducts(supplier));
  assert.equal(stored.name, 'Norte');
  assert.equal(stored.products[0]?.lastQuantity, 4);
  assert.equal(stored.products[0]?.lastItemName, 'CHOCOLATINA menta');
});
