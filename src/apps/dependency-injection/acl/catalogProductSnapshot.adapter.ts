import { ProductRepository } from '../../../contexts/catalog/application/ports/outbound/product.repository';
import { ProductSnapshot, ProductSnapshotProvider } from '../../../contexts/sales/application/ports/outbound/productSnapshotProvider.port';

export class CatalogProductSnapshotAdapter implements ProductSnapshotProvider {
  constructor(private readonly productRepository: ProductRepository) {}

  async getSnapshot(productId: string): Promise<ProductSnapshot | null> {
    const product = await this.productRepository.findById(productId);
    if (!product) return null;

    const primitives = product.toPrimitives();
    return {
      id: primitives.id,
      code: primitives.code,
      name: primitives.name ?? 'Sin nombre',
      wholesalePrice: primitives.wholesalePrice ?? 0,
      wholesaleCost: primitives.wholesaleCost ?? 0
    };
  }
}
