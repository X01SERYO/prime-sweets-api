import test from 'node:test';
import assert from 'node:assert/strict';
import { CreateSupplierUseCase } from '@/contexts/purchasing/application/use-cases/createSupplier/createSupplier.useCase';
import { GetSupplierUseCase } from '@/contexts/purchasing/application/use-cases/getSupplier/getSupplier.useCase';
import { SetSupplierProductsUseCase } from '@/contexts/purchasing/application/use-cases/setSupplierProducts/setSupplierProducts.useCase';
import { PurchaseProductReader } from '@/contexts/purchasing/application/ports/outbound/purchaseProductReader.port';
import { SupplierRepository } from '@/contexts/purchasing/application/ports/outbound/supplier.repository';
import { Supplier } from '@/contexts/purchasing/domain/entities/supplier';
import { ProductNotFoundForPurchaseError } from '@/contexts/purchasing/domain/errors/productNotFoundForPurchase.error';

function memorySuppliers(): SupplierRepository & { saved: Supplier | null } {
  const store = { saved: null as Supplier | null };
  return {
    saved: null,
    async list() {
      return [];
    },
    async findById(id) {
      return store.saved && store.saved.id === id ? store.saved : null;
    },
    async save(supplier) {
      store.saved = supplier;
      this.saved = supplier;
    }
  };
}

const catalog: PurchaseProductReader = {
  async findMany(ids) {
    return ids
      .filter(id => id === 'prod-1')
      .map(id => ({
        productId: id,
        productCode: 'A12',
        brandName: 'Jet',
        productName: 'Chocolatina',
        unitCost: 800
      }));
  }
};

test('creating a supplier stores the trimmed name', async () => {
  const suppliers = memorySuppliers();
  const result = await new CreateSupplierUseCase(suppliers, { next: () => 'sup-1' }).run('  Norte  ');
  assert.equal(result.isSuccess, true);
  assert.equal(result.value?.name, 'NORTE');
  assert.equal(suppliers.saved?.id, 'sup-1');
});

test('setting products keeps the last quantity of a product that stays', async () => {
  const suppliers = memorySuppliers();
  const supplier = Supplier.create('sup-1', 'Norte');
  supplier.linkProduct('prod-1');
  supplier.applySavedLines([{ productId: 'prod-1', quantity: 4, unitCost: 10, itemName: 'CHOCOLATINA menta' }]);
  await suppliers.save(supplier);

  const result = await new SetSupplierProductsUseCase(suppliers, catalog).run('sup-1', ['prod-1']);
  assert.equal(result.value?.products[0]?.lastQuantity, 4);
  assert.equal(result.value?.products[0]?.unitCost, 800);
  assert.equal(result.value?.products[0]?.productCode, 'A12');
});

test('an unknown product is rejected and the links stay', async () => {
  const suppliers = memorySuppliers();
  await suppliers.save(Supplier.create('sup-1', 'Norte'));
  const result = await new SetSupplierProductsUseCase(suppliers, catalog).run('sup-1', ['missing']);
  assert.equal(result.isSuccess, false);
  assert.ok(result.error instanceof ProductNotFoundForPurchaseError);
  const sheet = await new GetSupplierUseCase(suppliers, catalog).run('sup-1');
  assert.equal(sheet.value?.products.length, 0);
});
