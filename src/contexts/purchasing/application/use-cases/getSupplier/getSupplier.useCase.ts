import { Result } from '@/shared/application/result/result';
import { PurchaseProductReader } from '@/contexts/purchasing/application/ports/outbound/purchaseProductReader.port';
import { SupplierRepository } from '@/contexts/purchasing/application/ports/outbound/supplier.repository';
import { SupplierView, toSupplierView } from '@/contexts/purchasing/application/supplierView';
import { SupplierNotFoundError } from '@/contexts/purchasing/domain/errors/supplierNotFound.error';

export class GetSupplierUseCase {
  constructor(
    private readonly suppliers: SupplierRepository,
    private readonly products: PurchaseProductReader
  ) {}

  async run(id: string): Promise<Result<SupplierView>> {
    const supplier = await this.suppliers.findById(id);
    if (!supplier) {
      return Result.fail(new SupplierNotFoundError(id));
    }
    const catalog = await this.products.findMany(supplier.products.map(link => link.productId));
    return Result.ok(toSupplierView(supplier, catalog));
  }
}
