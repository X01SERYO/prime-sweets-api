import { DataSource } from 'typeorm';
import {
  SupplierRepository,
  SupplierListItem
} from '@/contexts/purchasing/application/ports/outbound/supplier.repository';
import { Supplier } from '@/contexts/purchasing/domain/entities/supplier';
import { PurchaseOrderEntity } from '@/contexts/purchasing/adapters/outbound/persistence/purchaseOrder.entity';
import { SupplierEntity } from '@/contexts/purchasing/adapters/outbound/persistence/supplier.entity';
import { SupplierProductEntity } from '@/contexts/purchasing/adapters/outbound/persistence/supplierProduct.entity';
import { SupplierMapper } from '@/contexts/purchasing/adapters/outbound/persistence/supplier.mapper';
import { replaceSupplierProducts } from '@/contexts/purchasing/adapters/outbound/persistence/replaceSupplierProducts';

export class TypeOrmSupplierRepository implements SupplierRepository {
  constructor(private readonly dataSource: DataSource) {}

  async list(): Promise<SupplierListItem[]> {
    const rows = await this.dataSource
      .getRepository(SupplierEntity)
      .createQueryBuilder('supplier')
      .leftJoin(SupplierProductEntity, 'product', 'product.supplierId = supplier.id')
      .select('supplier.id', 'id')
      .addSelect('supplier.name', 'name')
      .addSelect('COUNT(product.productId)', 'productCount')
      .groupBy('supplier.id')
      .addGroupBy('supplier.name')
      .orderBy('supplier.name', 'ASC')
      .getRawMany<{ id: string; name: string; productCount: string }>();

    const openOrders = await this.dataSource
      .getRepository(PurchaseOrderEntity)
      .createQueryBuilder('order')
      .select(['order.id', 'order.supplierId'])
      .where('order.lines IS NOT NULL')
      .getMany();
    const latestBySupplier = new Map(openOrders.map(order => [order.supplierId, order.id]));

    return rows.map(row => ({
      id: row.id,
      name: row.name.toLocaleUpperCase('es-CO'),
      productCount: Number(row.productCount),
      latestOrderId: latestBySupplier.get(row.id) ?? null
    }));
  }

  async findById(id: string): Promise<Supplier | null> {
    const entity = await this.dataSource.getRepository(SupplierEntity).findOne({ where: { id } });
    if (!entity) {
      return null;
    }
    const products = await this.dataSource.getRepository(SupplierProductEntity).find({ where: { supplierId: id } });
    return SupplierMapper.toDomain(entity, products);
  }

  async save(supplier: Supplier): Promise<void> {
    const entity = SupplierMapper.toEntity(supplier);
    await this.dataSource.transaction(async manager => {
      await manager.getRepository(SupplierEntity).save(entity);
      await replaceSupplierProducts(manager, supplier);
    });
  }
}
