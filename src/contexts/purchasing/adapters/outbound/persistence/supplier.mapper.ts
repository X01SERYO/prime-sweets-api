import { Supplier } from '@/contexts/purchasing/domain/entities/supplier';
import { SupplierEntity } from './supplier.entity';
import { SupplierProductEntity } from './supplierProduct.entity';

export class SupplierMapper {
  static toProducts(supplier: Supplier): SupplierProductEntity[] {
    return supplier.products.map(link => {
      const product = new SupplierProductEntity();
      product.supplierId = supplier.id;
      product.productId = link.productId;
      product.previousQuantity = link.previousQuantity;
      product.lastQuantity = link.lastQuantity;
      product.lastUnitCost = link.lastUnitCost;
      product.lastItemName = link.lastItemName;
      product.items = link.items.map(item => ({ itemName: item.itemName, lastQuantity: item.lastQuantity }));
      return product;
    });
  }

  static toEntity(supplier: Supplier): SupplierEntity {
    const entity = new SupplierEntity();
    entity.id = supplier.id;
    entity.name = supplier.name;
    return entity;
  }

  static toDomain(entity: SupplierEntity, products: SupplierProductEntity[]): Supplier {
    return Supplier.rehydrate({
      id: entity.id,
      name: entity.name,
      products: products.map(product => ({
        productId: product.productId,
        previousQuantity: product.previousQuantity,
        lastQuantity: product.lastQuantity,
        lastUnitCost: product.lastUnitCost,
        lastItemName: product.lastItemName,
        items: Array.isArray(product.items) ? product.items.map(item => ({ ...item })) : []
      }))
    });
  }
}
