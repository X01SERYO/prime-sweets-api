import test from 'node:test';
import assert from 'node:assert/strict';
import { CreateProductUseCase } from '@/contexts/catalog/application/use-cases/createProduct/createProduct.useCase';
import { ProductRepository } from '@/contexts/catalog/application/ports/outbound/product.repository';
import { BrandRepository } from '@/contexts/catalog/application/ports/outbound/brand.repository';
import { Brand } from '@/contexts/catalog/domain/entities/brand';
import { Product } from '@/contexts/catalog/domain/entities/product';
import { ProductAlegraSyncError } from '@/contexts/catalog/domain/errors/productAlegraSync.error';
import { BrandNotFoundError } from '@/contexts/catalog/domain/errors/brandNotFound.error';

const ids = { next: () => 'p-1' };

function productRepo(existing: Product | null = null): ProductRepository {
  const saved: Product[] = [];
  return {
    async save(product) {
      saved.push(product);
    },
    async findById() {
      return null;
    },
    async findByAlegraId() {
      return existing;
    },
    async findAll() {
      return saved;
    },
    async search() {
      return [];
    },
    async page() {
      return { items: [], total: 0 };
    },
    async delete() {},
    async nextProductCode() {
      return 'ACM-1';
    }
  } as ProductRepository;
}

test('CreateProductUseCase stores the product after Alegra confirms the id', async () => {
  const brands: BrandRepository = {
    async findById() {
      return Brand.create('b-1', 'Acme', 'ACM');
    },
    async findAll() {
      return [];
    },
    async findByName() {
      return null;
    },
    async findByCode() {
      return null;
    },
    async save() {},
    async delete() {}
  };
  const useCase = new CreateProductUseCase(productRepo(), brands, ids, {
    async create() {
      return 'alegra-1';
    }
  });

  const result = await useCase.run({
    name: 'soda',
    brandId: 'b-1',
    wholesalePrice: 1000,
    retailPrice: 1500,
    wholesaleCost: null,
    retailCost: null,
    units: 2
  });

  assert.equal(result.isSuccess, true);
  assert.equal(result.value?.name, 'SODA');
  assert.equal(result.value?.code, 'ACM-1');
});

test('CreateProductUseCase rejects a missing brand, a missing price, and an Alegra failure', async () => {
  const brands: BrandRepository = {
    async findById() {
      return null;
    },
    async findAll() {
      return [];
    },
    async findByName() {
      return null;
    },
    async findByCode() {
      return null;
    },
    async save() {},
    async delete() {}
  };
  const missingBrand = new CreateProductUseCase(productRepo(), brands, ids, { async create() { return 'x'; } });
  const brandResult = await missingBrand.run({ name: 'soda', brandId: 'missing', wholesalePrice: 1, retailPrice: 1 });
  assert.ok(brandResult.error instanceof BrandNotFoundError);

  const noBrand: BrandRepository = { ...brands, async findById() { return Brand.create('b-1', 'Acme', 'ACM'); } };
  const missingPrice = new CreateProductUseCase(productRepo(), noBrand, ids, { async create() { return 'x'; } });
  const priceResult = await missingPrice.run({ name: 'soda', wholesalePrice: -1 });
  assert.equal(priceResult.isSuccess, false);

  const alegra = new CreateProductUseCase(productRepo(), noBrand, ids, {
    async create() {
      throw new Error('down');
    }
  });
  const alegraResult = await alegra.run({ name: 'soda', wholesalePrice: 1, retailPrice: 1 });
  assert.ok(alegraResult.error instanceof ProductAlegraSyncError);
});
