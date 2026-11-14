import test from 'node:test';
import assert from 'node:assert/strict';
import { ListProductsUseCase } from '@/contexts/catalog/application/use-cases/listProducts/listProducts.useCase';
import { Product } from '@/contexts/catalog/domain/entities/product';
import { ProductRepository } from '@/contexts/catalog/application/ports/outbound/product.repository';

const product = Product.create({ id: 'p1', alegraId: 'a1', name: 'Soda', wholesalePrice: 1, retailPrice: 2 });

function repository(): ProductRepository {
  return {
    async findAll() {
      return [product];
    },
    async page() {
      return { items: [product], total: 1 };
    },
    async findById() { return null; },
    async findByAlegraId() { return null; },
    async search() { return []; },
    async nextProductCode() { return 'GEN1'; },
    async save() {},
    async delete() {}
  };
}

test('ListProductsUseCase returns every product or one page', async () => {
  const useCase = new ListProductsUseCase(repository());
  const all = await useCase.run();
  assert.equal(Array.isArray(all.value), true);
  const page = await useCase.run({ page: 2 });
  assert.equal((page.value as { pageSize: number }).pageSize, 20);
});
