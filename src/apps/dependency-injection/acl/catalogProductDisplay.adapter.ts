import { BrandRepository } from '../../../contexts/catalog/application/ports/outbound/brand.repository';
import { ProductRepository } from '../../../contexts/catalog/application/ports/outbound/product.repository';
import { CatalogProductDisplay } from '../../../contexts/fulfillment-output/domain/entities/loadSheet';
import { CatalogProductDisplayQuery } from '../../../contexts/fulfillment-output/application/ports/outbound/catalogProductDisplayQuery.port';

export class CatalogProductDisplayAdapter implements CatalogProductDisplayQuery {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly brandRepository: BrandRepository
  ) {}

  async findByProductIds(productIds: string[]): Promise<CatalogProductDisplay[]> {
    const displays: CatalogProductDisplay[] = [];

    for (const productId of productIds) {
      const product = await this.productRepository.findById(productId);
      if (!product) {
        continue;
      }

      const primitives = product.toPrimitives();
      let brand: string | null = null;

      if (primitives.brandId) {
        const foundBrand = await this.brandRepository.findById(primitives.brandId);
        brand = foundBrand ? foundBrand.toPrimitives().name : null;
      }

      displays.push({
        productId: primitives.id,
        brand,
        name: primitives.name ?? ''
      });
    }

    return displays;
  }
}
