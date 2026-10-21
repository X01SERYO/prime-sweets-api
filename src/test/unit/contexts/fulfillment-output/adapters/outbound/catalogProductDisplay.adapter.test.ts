import test from 'node:test';
import assert from 'node:assert/strict';
import { CatalogProductDisplayAdapter } from '../../../../../../contexts/fulfillment-output/adapters/outbound/catalogProductDisplay.adapter';
import { ProductRepository } from '../../../../../../contexts/catalog/application/ports/outbound/product.repository';
import { BrandRepository } from '../../../../../../contexts/catalog/application/ports/outbound/brand.repository';
import { Product } from '../../../../../../contexts/catalog/domain/entities/product';
import { Brand } from '../../../../../../contexts/catalog/domain/entities/brand';

test('CatalogProductDisplayAdapter - resolves catalog name and brand, skipping missing products', async () => {
  const product = Product.create({
    id: 'p-1',
    alegraId: 'A-1',
    brandId: 'b-1',
    name: 'Catalog Soda',
    wholesaleCost: 10,
    wholesalePrice: 20
  });
  const productRepository: ProductRepository = {
    async findById(id) {
      return id === 'p-1' ? product : null;
    },
    async findByAlegraId() {
      return null;
    },
    async findAll() {
      return [];
    },
    async search() {
      return [];
    },
    async save() {},
    async delete() {}
  };
  const brandRepository: BrandRepository = {
    async findById(id) {
      return id === 'b-1' ? Brand.create('b-1', 'Acme', 'ACM') : null;
    },
    async save() {},
    async findByName() {
      return null;
    },
    async findByCode() {
      return null;
    },
    async findAll() {
      return [];
    },
    async delete() {}
  };

  const displays = await new CatalogProductDisplayAdapter(productRepository, brandRepository).findByProductIds([
    'p-1',
    'missing'
  ]);

  assert.deepEqual(displays, [{ productId: 'p-1', brand: 'Acme', name: 'Catalog Soda' }]);
});
