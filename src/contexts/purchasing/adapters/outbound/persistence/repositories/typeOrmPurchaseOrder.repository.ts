import { DataSource } from 'typeorm';
import {
  PurchaseOrderHeader,
  PurchaseOrderRepository
} from '@/contexts/purchasing/application/ports/outbound/purchaseOrder.repository';
import { PurchaseOrder } from '@/contexts/purchasing/domain/entities/purchaseOrder';
import { Supplier } from '@/contexts/purchasing/domain/entities/supplier';
import { PurchaseOrderEntity } from '@/contexts/purchasing/adapters/outbound/persistence/purchaseOrder.entity';
import { PurchaseOrderMapper } from '@/contexts/purchasing/adapters/outbound/persistence/purchaseOrder.mapper';
import { SupplierEntity } from '@/contexts/purchasing/adapters/outbound/persistence/supplier.entity';
import { replaceSupplierProducts } from '@/contexts/purchasing/adapters/outbound/persistence/replaceSupplierProducts';

export class TypeOrmPurchaseOrderRepository implements PurchaseOrderRepository {
  constructor(private readonly dataSource: DataSource) {}

  async save(order: PurchaseOrder, supplier: Supplier): Promise<void> {
    await this.dataSource.transaction(async manager => {
      await manager
        .getRepository(PurchaseOrderEntity)
        .createQueryBuilder()
        .update()
        .set({ lines: null })
        .where('supplier_id = :supplierId', { supplierId: order.supplierId })
        .andWhere('lines IS NOT NULL')
        .execute();
      await manager.getRepository(PurchaseOrderEntity).insert(PurchaseOrderMapper.toEntity(order));
      await replaceSupplierProducts(manager, supplier);
    });
  }

  async findById(id: string): Promise<PurchaseOrder | null> {
    const entity = await this.dataSource.getRepository(PurchaseOrderEntity).findOne({ where: { id } });
    return entity ? PurchaseOrderMapper.toDomain(entity) : null;
  }

  async list(
    supplierId: string,
    page: number,
    pageSize: number
  ): Promise<{ items: PurchaseOrderHeader[]; total: number }> {
    const [entities, total] = await this.dataSource.getRepository(PurchaseOrderEntity).findAndCount({
      where: { supplierId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize
    });
    const supplier = await this.dataSource.getRepository(SupplierEntity).findOne({ where: { id: supplierId } });
    const supplierName = supplier?.name ?? '';
    return {
      total,
      items: entities.map(entity => ({
        id: entity.id,
        supplierId: entity.supplierId,
        supplierName,
        createdAt: entity.createdAt,
        lineCount: entity.lineCount,
        totalCost: Number(entity.totalCost),
        hasLines: entity.lines !== null
      }))
    };
  }
}
