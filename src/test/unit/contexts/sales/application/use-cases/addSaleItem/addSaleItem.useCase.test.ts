import test from 'node:test';
import assert from 'node:assert/strict';
import { AddSaleItemUseCase } from '../../../../../../../contexts/sales/application/use-cases/addSaleItem/addSaleItem.useCase';
import { Sale } from '../../../../../../../contexts/sales/domain/entities/sale';
import { SaleRepository } from '../../../../../../../contexts/sales/application/ports/outbound/sale.repository';
import { ProductSnapshotProvider } from '../../../../../../../contexts/sales/application/ports/outbound/productSnapshotProvider.port';
import { SaleNotFoundError } from '../../../../../../../contexts/sales/domain/errors/saleNotFound.error';
import { ProductNotFoundForSaleError } from '../../../../../../../contexts/sales/domain/errors/productNotFoundForSale.error';

const ids = { next: () => `id-${Math.random()}` };

test('AddSaleItemUseCase - adds item to draft sale successfully', async () => {
  const sale = Sale.create({ id: 's-1', sellerId: 'seller-1', captureDate: '2026-11-04', customerId: 'c-1', deliveryDate: '2026-10-31' });
  let saved: Sale = sale;

  const repo: SaleRepository = {
    async save(s) {
      saved = s;
    },
    async findById() {
      return saved;
    },
    async list() {
      return [];
    }
  };

  const productProvider: ProductSnapshotProvider = {
    async getSnapshot(id) {
      if (id === 'p-100') {
        return { id: 'p-100', code: 'NAC001', name: 'Chocolatina Jet', wholesalePrice: 800, wholesaleCost: 500 };
      }
      return null;
    }
  };

  const useCase = new AddSaleItemUseCase(repo, productProvider, ids);

  const result = await useCase.run({
    saleId: 's-1',
    productId: 'p-100',
    quantity: 5
  });

  assert.equal(result.isSuccess, true);
  assert.equal(result.value?.items.length, 1);
  assert.equal(result.value?.items[0].itemName, 'Chocolatina Jet');
  assert.equal(result.value?.totalAmount, 4000);
  assert.equal(result.value?.totalProfit, 1500);
});

test('AddSaleItemUseCase - fails if sale not found', async () => {
  const repo: SaleRepository = {
    async save() {},
    async findById() {
      return null;
    },
    async list() {
      return [];
    }
  };

  const productProvider: ProductSnapshotProvider = {
    async getSnapshot() {
      return null;
    }
  };

  const useCase = new AddSaleItemUseCase(repo, productProvider, ids);
  const result = await useCase.run({ saleId: 'unknown', productId: 'p-1', quantity: 1 });

  assert.equal(result.isSuccess, false);
  assert.ok(result.error instanceof SaleNotFoundError);
});

test('AddSaleItemUseCase - fails if product not found in catalog', async () => {
  const sale = Sale.create({ id: 's-1', sellerId: 'seller-1', captureDate: '2026-11-04', customerId: 'c-1', deliveryDate: '2026-10-31' });
  const repo: SaleRepository = {
    async save() {},
    async findById() {
      return sale;
    },
    async list() {
      return [];
    }
  };

  const productProvider: ProductSnapshotProvider = {
    async getSnapshot() {
      return null;
    }
  };

  const useCase = new AddSaleItemUseCase(repo, productProvider, ids);
  const result = await useCase.run({ saleId: 's-1', productId: 'non-existent', quantity: 1 });

  assert.equal(result.isSuccess, false);
  assert.ok(result.error instanceof ProductNotFoundForSaleError);
});
