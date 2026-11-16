import test from 'node:test';
import assert from 'node:assert/strict';
import { CreatePurchaseOrderUseCase } from '@/contexts/purchasing/application/use-cases/createPurchaseOrder/createPurchaseOrder.useCase';
import { PurchaseOrderRepository } from '@/contexts/purchasing/application/ports/outbound/purchaseOrder.repository';
import { PurchaseProductReader } from '@/contexts/purchasing/application/ports/outbound/purchaseProductReader.port';
import { SupplierRepository } from '@/contexts/purchasing/application/ports/outbound/supplier.repository';
import { PurchaseOrder } from '@/contexts/purchasing/domain/entities/purchaseOrder';
import { Supplier } from '@/contexts/purchasing/domain/entities/supplier';
import { ProductNotLinkedError } from '@/contexts/purchasing/domain/errors/productNotLinked.error';
import { ProductWithoutCostError } from '@/contexts/purchasing/domain/errors/productWithoutCost.error';

const catalog: PurchaseProductReader = {
  async findMany(ids) {
    return ids.map(id => ({
      productId: id,
      productCode: 'A12',
      brandName: 'Jet',
      productName: 'Chocolatina',
      unitCost: id === 'no-cost' ? null : 800.5
    }));
  }
};

test('saving an order snapshots the catalog cost and the extra name, and stores the last quantity', async () => {
  const supplier = Supplier.create('sup-1', 'Norte');
  supplier.linkProduct('prod-1');
  const committed: { lines: number; lastQuantity: number | null } = { lines: 0, lastQuantity: null };
  const suppliers: SupplierRepository = {
    async list() {
      return [];
    },
    async findById() {
      return supplier;
    },
    async save() {}
  };
  const orders: PurchaseOrderRepository = {
    async save(order, savedSupplier) {
      committed.lines = order.lineCount;
      committed.lastQuantity = savedSupplier.products[0]?.lastQuantity ?? null;
    },
    async findById() {
      return null;
    },
    async list() {
      return { items: [], total: 0 };
    }
  };

  const result = await new CreatePurchaseOrderUseCase(suppliers, orders, catalog, { next: () => 'po-1' }).run(
    'sup-1',
    [{ productId: 'prod-1', quantity: 2, itemName: 'Chocolatina fresa' }]
  );

  assert.equal(result.isSuccess, true);
  assert.equal(result.value?.lines[0]?.itemName, 'CHOCOLATINA fresa');
  assert.equal(result.value?.lines[0]?.unitCost, 800.5);
  assert.equal(result.value?.totalCost, 1601);
  assert.equal(committed.lastQuantity, 2);
});

test('a product that is not linked and a product without cost are rejected', async () => {
  const supplier = Supplier.create('sup-1', 'Norte');
  supplier.linkProduct('no-cost');
  const suppliers: SupplierRepository = {
    async list() {
      return [];
    },
    async findById() {
      return supplier;
    },
    async save() {}
  };
  const orders: PurchaseOrderRepository = {
    async save() {},
    async findById() {
      return PurchaseOrder.rehydrate({
        id: 'po-1',
        supplierId: 'sup-1',
        lines: null,
        lineCount: 0,
        totalCost: 0,
        createdAt: new Date()
      });
    },
    async list() {
      return { items: [], total: 0 };
    }
  };
  const useCase = new CreatePurchaseOrderUseCase(suppliers, orders, catalog, { next: () => 'po-1' });
  const unlinked = await useCase.run('sup-1', [{ productId: 'prod-1', quantity: 1 }]);
  const noCost = await useCase.run('sup-1', [{ productId: 'no-cost', quantity: 1 }]);
  assert.ok(unlinked.error instanceof ProductNotLinkedError);
  assert.ok(noCost.error instanceof ProductWithoutCostError);
});
