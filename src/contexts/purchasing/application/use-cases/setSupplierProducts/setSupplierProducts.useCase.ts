import { Result } from '@/shared/application/result/result';
import { PurchaseProductReader } from '@/contexts/purchasing/application/ports/outbound/purchaseProductReader.port';
import { SupplierRepository } from '@/contexts/purchasing/application/ports/outbound/supplier.repository';
import { SupplierView, toSupplierView } from '@/contexts/purchasing/application/supplierView';
import { ProductNotFoundForPurchaseError } from '@/contexts/purchasing/domain/errors/productNotFoundForPurchase.error';
import { SupplierNotFoundError } from '@/contexts/purchasing/domain/errors/supplierNotFound.error';

export class SetSupplierProductsUseCase {
  constructor(
    private readonly suppliers: SupplierRepository,
    private readonly products: PurchaseProductReader
  ) {}

  async run(id: string, productIds: string[]): Promise<Result<SupplierView>> {
    const supplier = await this.suppliers.findById(id);
    if (!supplier) {
      return Result.fail(new SupplierNotFoundError(id));
    }
    const uniqueIds = [...new Set(productIds)];
    const catalog = await this.products.findMany(uniqueIds);
    const found = new Set(catalog.map(product => product.productId));
    const missing = uniqueIds.find(productId => !found.has(productId));
    if (missing) {
      return Result.fail(new ProductNotFoundForPurchaseError(missing));
    }
    const next = new Set(uniqueIds);
    for (const link of supplier.products) {
      if (!next.has(link.productId)) {
        supplier.unlinkProduct(link.productId);
      }
    }
    for (const productId of uniqueIds) {
      supplier.linkProduct(productId);
    }
    await this.suppliers.save(supplier);
    return Result.ok(toSupplierView(supplier, catalog));
  }
}
