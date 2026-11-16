import { Result } from '@/shared/application/result/result';
import {
  PurchaseOrderHeader,
  PurchaseOrderRepository
} from '@/contexts/purchasing/application/ports/outbound/purchaseOrder.repository';

export class ListPurchaseOrdersUseCase {
  constructor(private readonly orders: PurchaseOrderRepository) {}

  async run(query: {
    supplierId: string;
    page?: number;
    pageSize?: number;
  }): Promise<Result<{ items: PurchaseOrderHeader[]; total: number; page: number; pageSize: number }>> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const listed = await this.orders.list(query.supplierId, page, pageSize);
    return Result.ok({ ...listed, page, pageSize });
  }
}
