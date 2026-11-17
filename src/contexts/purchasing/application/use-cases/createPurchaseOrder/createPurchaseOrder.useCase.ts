import { IdGenerator } from '@/shared/application/ports/idGenerator';
import { Result } from '@/shared/application/result/result';
import { DomainError } from '@/shared/domain/errors/domainError';
import { PurchaseProductReader } from '@/contexts/purchasing/application/ports/outbound/purchaseProductReader.port';
import { PurchaseOrderRepository } from '@/contexts/purchasing/application/ports/outbound/purchaseOrder.repository';
import { SupplierRepository } from '@/contexts/purchasing/application/ports/outbound/supplier.repository';
import { PurchaseOrder, PurchaseOrderPrimitives } from '@/contexts/purchasing/domain/entities/purchaseOrder';
import { ProductNotLinkedError } from '@/contexts/purchasing/domain/errors/productNotLinked.error';
import { ProductWithoutCostError } from '@/contexts/purchasing/domain/errors/productWithoutCost.error';
import { SupplierNotFoundError } from '@/contexts/purchasing/domain/errors/supplierNotFound.error';

export type CreatePurchaseOrderLineDto = {
  productId: string;
  quantity: number;
  itemName?: string;
};

export class CreatePurchaseOrderUseCase {
  constructor(
    private readonly suppliers: SupplierRepository,
    private readonly orders: PurchaseOrderRepository,
    private readonly products: PurchaseProductReader,
    private readonly ids: IdGenerator
  ) {}

  async run(
    supplierId: string,
    lines: CreatePurchaseOrderLineDto[],
    assortment: { productId: string; itemName: string }[] = []
  ): Promise<Result<PurchaseOrderPrimitives>> {
    const supplier = await this.suppliers.findById(supplierId);
    if (!supplier) {
      return Result.fail(new SupplierNotFoundError(supplierId));
    }
    const linked = new Set(supplier.products.map(link => link.productId));
    const missingLink = lines.find(line => !linked.has(line.productId));
    if (missingLink) {
      return Result.fail(new ProductNotLinkedError(missingLink.productId));
    }
    const catalog = await this.products.findMany(lines.map(line => line.productId));
    const byId = new Map(catalog.map(product => [product.productId, product]));
    const snapshots = [];
    for (const line of lines) {
      const product = byId.get(line.productId);
      if (!product || product.unitCost === null || product.unitCost <= 0) {
        return Result.fail(new ProductWithoutCostError(line.productId));
      }
      snapshots.push({
        productId: product.productId,
        productCode: product.productCode,
        brandName: product.brandName,
        catalogName: product.productName,
        itemName: line.itemName?.trim() || product.productName,
        unitCost: product.unitCost,
        quantity: line.quantity
      });
    }
    try {
      const order = PurchaseOrder.create(this.ids.next(), supplierId, snapshots, new Date());
      supplier.rememberItems(assortment);
      supplier.applySavedLines(order.lines);
      await this.orders.save(order, supplier);
      return Result.ok(order.toPrimitives());
    } catch (error) {
      if (error instanceof DomainError) {
        return Result.fail(error);
      }
      throw error;
    }
  }
}
