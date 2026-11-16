import { EntityManager } from 'typeorm';
import { Supplier } from '@/contexts/purchasing/domain/entities/supplier';
import { SupplierMapper } from './supplier.mapper';
import { SupplierProductEntity } from './supplierProduct.entity';

export async function replaceSupplierProducts(manager: EntityManager, supplier: Supplier): Promise<void> {
  const products = SupplierMapper.toProducts(supplier);
  await manager.getRepository(SupplierProductEntity).delete({ supplierId: supplier.id });
  if (products.length > 0) {
    await manager.getRepository(SupplierProductEntity).save(products);
  }
}
