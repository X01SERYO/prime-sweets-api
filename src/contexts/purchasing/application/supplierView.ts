import { Supplier } from '@/contexts/purchasing/domain/entities/supplier';
import { PurchaseProductSheet } from '@/contexts/purchasing/application/ports/outbound/purchaseProductReader.port';

export type SupplierProductView = {
  productId: string;
  productCode: string | null;
  brandName: string | null;
  productName: string | null;
  unitCost: number | null;
  lastQuantity: number | null;
  lastItemName: string | null;
};

export type SupplierView = {
  id: string;
  name: string;
  products: SupplierProductView[];
};

export function toSupplierView(supplier: Supplier, catalog: PurchaseProductSheet[]): SupplierView {
  const byId = new Map(catalog.map(product => [product.productId, product]));
  return {
    id: supplier.id,
    name: supplier.name,
    products: supplier.products.map(link => {
      const product = byId.get(link.productId);
      return {
        productId: link.productId,
        productCode: product?.productCode ?? null,
        brandName: product?.brandName ?? null,
        productName: product?.productName ?? null,
        unitCost: product?.unitCost ?? null,
        lastQuantity: link.lastQuantity,
        lastItemName: link.lastItemName
      };
    })
  };
}
