import { PurchaseOrder } from '@/contexts/purchasing/domain/entities/purchaseOrder';
import { PurchaseOrderEntity } from './purchaseOrder.entity';

export class PurchaseOrderMapper {
  static toEntity(order: PurchaseOrder): PurchaseOrderEntity {
    const entity = new PurchaseOrderEntity();
    entity.id = order.id;
    entity.supplierId = order.supplierId;
    entity.lineCount = order.lineCount;
    entity.totalCost = order.totalCost;
    entity.lines = order.hasLines ? order.lines : null;
    entity.createdAt = order.createdAt;
    return entity;
  }

  static toDomain(entity: PurchaseOrderEntity): PurchaseOrder {
    return PurchaseOrder.rehydrate({
      id: entity.id,
      supplierId: entity.supplierId,
      lines: entity.lines,
      lineCount: entity.lineCount,
      totalCost: Number(entity.totalCost),
      createdAt: entity.createdAt
    });
  }
}
