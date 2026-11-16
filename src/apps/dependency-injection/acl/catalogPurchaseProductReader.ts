import { ProductRepository } from '@/contexts/catalog/application/ports/outbound/product.repository';
import {
  PurchaseProductReader,
  PurchaseProductSheet
} from '@/contexts/purchasing/application/ports/outbound/purchaseProductReader.port';

export class CatalogPurchaseProductReader implements PurchaseProductReader {
  constructor(private readonly products: ProductRepository) {}

  async findMany(productIds: string[]): Promise<PurchaseProductSheet[]> {
    const sheets: PurchaseProductSheet[] = [];
    for (const productId of productIds) {
      const product = await this.products.findById(productId);
      if (!product) {
        continue;
      }
      const primitives = product.toPrimitives();
      sheets.push({
        productId: primitives.id,
        productCode: primitives.code,
        brandName: primitives.brandName ?? '',
        productName: primitives.name ?? '',
        unitCost: primitives.wholesaleCost
      });
    }
    return sheets;
  }
}
