import { ProductRepository } from '@/contexts/catalog/application/ports/outbound/product.repository';
import { RetailProductSnapshotProvider } from '@/contexts/retail-sales/application/ports/outbound/retailProductSnapshotProvider.port';
import { RetailProductSnapshot } from '@/contexts/retail-sales/domain/entities/retailDayItem';

export class CatalogRetailProductSnapshotProvider implements RetailProductSnapshotProvider {
  constructor(private readonly products: ProductRepository) {}

  async getSnapshot(productId: string): Promise<RetailProductSnapshot | null> {
    const product = await this.products.findById(productId);
    if (!product) {
      return null;
    }
    const primitives = product.toPrimitives();
    return {
      productId: primitives.id,
      productCode: primitives.code,
      brandName: primitives.brandName ?? '',
      productName: primitives.name ?? 'Sin nombre',
      retailPrice: primitives.retailPrice ?? 0,
      retailCost: primitives.retailCost,
    };
  }
}
