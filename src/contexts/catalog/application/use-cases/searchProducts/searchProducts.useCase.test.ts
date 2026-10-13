import test from 'node:test';
import assert from 'node:assert/strict';
import { Product } from '../../../domain/entities/product';
import { ProductRepository } from '../../ports/outbound/product.repository';
import { SearchProductsUseCase } from './searchProducts.useCase';

class MockProductRepository implements ProductRepository {
  public searchCalledWith: string | null = null;
  public findAllCalled = false;

  private products: Product[] = [
    Product.create({
      id: 'prod-1',
      alegraId: 'alg-1',
      brandId: 'brand-1',
      name: 'Chupetín Sabor Fresa',
      wholesalePrice: 1500,
      retailPrice: 2000
    }),
    Product.create({
      id: 'prod-2',
      alegraId: 'alg-2',
      brandId: 'brand-2',
      name: 'Caramelo Menta',
      wholesalePrice: 800,
      retailPrice: 1000
    })
  ];

  async findById(_id: string): Promise<Product | null> {
    return null;
  }

  async findByAlegraId(_alegraId: string): Promise<Product | null> {
    return null;
  }

  async findAll(): Promise<Product[]> {
    this.findAllCalled = true;
    return this.products;
  }

  async search(term: string): Promise<Product[]> {
    this.searchCalledWith = term;
    return this.products.filter((p) => p.name?.toLowerCase().includes(term.toLowerCase()));
  }

  async save(_product: Product): Promise<void> {}
  async delete(_id: string): Promise<void> {}
}

test('SearchProductsUseCase - delegates to repository.search when query is provided', async () => {
  const repository = new MockProductRepository();
  const useCase = new SearchProductsUseCase(repository);

  const result = await useCase.run({ query: 'Fresa' });

  assert.equal(result.isSuccess, true);
  assert.equal(repository.searchCalledWith, 'Fresa');
  assert.equal(repository.findAllCalled, false);
  assert.equal(result.value!.length, 1);
  assert.equal(result.value![0].name, 'Chupetín Sabor Fresa');
  assert.equal(result.value![0].wholesalePrice, 1500);
});

test('SearchProductsUseCase - delegates to repository.findAll when query is empty or not provided', async () => {
  const repository = new MockProductRepository();
  const useCase = new SearchProductsUseCase(repository);

  const result = await useCase.run({ query: '   ' });

  assert.equal(result.isSuccess, true);
  assert.equal(repository.findAllCalled, true);
  assert.equal(repository.searchCalledWith, null);
  assert.equal(result.value!.length, 2);
});
