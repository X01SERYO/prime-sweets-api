import { Supplier } from '@/contexts/purchasing/domain/entities/supplier';

export type SupplierListItem = {
  id: string;
  name: string;
  productCount: number;
};

export interface SupplierRepository {
  list(): Promise<SupplierListItem[]>;
  findById(id: string): Promise<Supplier | null>;
  save(supplier: Supplier): Promise<void>;
}
