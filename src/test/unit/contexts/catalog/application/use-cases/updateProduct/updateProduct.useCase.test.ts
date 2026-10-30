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
    async save() {},
    async delete() {}
  };
}

test('UpdateProductUseCase keeps the local product when Alegra sync fails', async () => {
  const sync: ProductAlegraSyncService = {
    async sync() {
      throw new Error('Alegra unavailable');
    }
  };
  const useCase = new UpdateProductUseCase(repository(), sync);

  const result = await useCase.run({ id: stored.id, name: 'Gomita fresa' });

  assert.equal(result.isSuccess, true);
  assert.equal(result.value?.name, 'Gomita fresa');
});
