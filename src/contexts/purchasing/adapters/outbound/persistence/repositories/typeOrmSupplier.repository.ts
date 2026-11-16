import { DataSource } from 'typeorm';
import {
  SupplierRepository,
  SupplierListItem
} from '@/contexts/purchasing/application/ports/outbound/supplier.repository';
import { Supplier } from '@/contexts/purchasing/domain/entities/supplier';
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

    return rows.map(row => ({
      id: row.id,
      name: row.name,
      productCount: Number(row.productCount)
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
