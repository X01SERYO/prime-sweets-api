import { Result } from '@/shared/application/result/result';
import { PurchaseOrderRepository } from '@/contexts/purchasing/application/ports/outbound/purchaseOrder.repository';
import { PurchaseOrderPrimitives } from '@/contexts/purchasing/domain/entities/purchaseOrder';
import { PurchaseOrderNotFoundError } from '@/contexts/purchasing/domain/errors/purchaseOrderNotFound.error';

export class GetPurchaseOrderUseCase {
  constructor(private readonly orders: PurchaseOrderRepository) {}

  async run(id: string): Promise<Result<PurchaseOrderPrimitives & { hasLines: boolean }>> {
    const order = await this.orders.findById(id);
    if (!order) {
      return Result.fail(new PurchaseOrderNotFoundError(id));
    }
    return Result.ok({ ...order.toPrimitives(), hasLines: order.hasLines });
  }
}
