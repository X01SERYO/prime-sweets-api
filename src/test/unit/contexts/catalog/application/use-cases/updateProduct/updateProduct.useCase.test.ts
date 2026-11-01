import test from 'node:test';
import assert from 'node:assert/strict';
import { Product } from '../../../../../../../contexts/catalog/domain/entities/product';
import { UpdateProductUseCase } from '../../../../../../../contexts/catalog/application/use-cases/updateProduct/updateProduct.useCase';
import { ProductRepository } from '../../../../../../../contexts/catalog/application/ports/outbound/product.repository';
import { ProductAlegraSyncService } from '../../../../../../../contexts/catalog/application/ports/outbound/productAlegraSync.service';

const stored = Product.create({
  id: 'product-1',
  alegraId: 'ALG-1',
  name: 'Gomita',
  wholesalePrice: 1000,
  retailPrice: 1500
});

function repository(): ProductRepository {
  return {
    async findById(id: string) {
      return id === stored.id ? stored : null;
    },
    async findByAlegraId() {
      return null;
    },
    async findAll() {
      return [stored];
    },
    async search() {
      return [stored];
    },
    async page() {
      return { items: [stored], total: 1 };
    },
    async nextProductCode() {
      return 'GEN001';
    },
    async save() {},
    async delete() {}
  };
}

test('UpdateProductUseCase stores a zero sale price and notifies only that price', async () => {
  const calls: Array<Record<string, unknown>> = [];
  const sync: ProductAlegraSyncService = {
    async sync(input) {
      calls.push(input);
    }
  };
  const useCase = new UpdateProductUseCase(repository(), sync);

  const result = await useCase.run({ id: stored.id, retailPrice: 0 });

  assert.equal(result.isSuccess, true);
  assert.equal(result.value?.retailPrice, 0);
  assert.equal(result.value?.wholesalePrice, 1000);
  assert.deepEqual(calls, [{ alegraId: 'ALG-1', retailPrice: 0 }]);
});

test('UpdateProductUseCase stores cost and units without calling Alegra', async () => {
  let called = false;
  const sync: ProductAlegraSyncService = {
    async sync() {
      called = true;
    }
  };
  const useCase = new UpdateProductUseCase(repository(), sync);

  const result = await useCase.run({ id: stored.id, wholesaleCost: 0, units: 12, pack: 6 });

  assert.equal(result.isSuccess, true);
  assert.equal(result.value?.wholesaleCost, 0);
  assert.equal(result.value?.units, 12);
  assert.equal(result.value?.pack, 6);
  assert.equal(called, false);
});

test('UpdateProductUseCase rejects a negative price and an empty name', async () => {
  const useCase = new UpdateProductUseCase(repository(), { async sync() {} });

  const negative = await useCase.run({ id: stored.id, wholesalePrice: -1 });
  const empty = await useCase.run({ id: stored.id, name: '   ' });

  assert.equal(negative.isSuccess, false);
  assert.equal(empty.isSuccess, false);
});

test('UpdateProductUseCase keeps the local product when Alegra sync fails', async () => {
  const sync: ProductAlegraSyncService = {
    async sync() {
      throw new Error('Alegra unavailable');
    }
  };
  const useCase = new UpdateProductUseCase(repository(), sync);

  const result = await useCase.run({ id: stored.id, name: 'Gomita fresa' });

  assert.equal(result.isSuccess, true);
  assert.equal(result.value?.name, 'GOMITA FRESA');
});
