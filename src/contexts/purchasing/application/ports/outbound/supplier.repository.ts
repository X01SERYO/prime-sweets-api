import { Supplier } from '@/contexts/purchasing/domain/entities/supplier';

export type SupplierListItem = {
  id: string;
  name: string;
  productCount: number;
  latestOrderId: string | null;
};

export interface SupplierRepository {
  list(): Promise<SupplierListItem[]>;
  findById(id: string): Promise<Supplier | null>;
  save(supplier: Supplier): Promise<void>;
}
