import { Sale } from '../../../domain/entities/sale';

export type ListSalesFilters = {
  deliveryDate?: string;
  customerId?: string;
  status?: 'DRAFT' | 'CONFIRMED' | 'VOIDED';
};

export interface SaleRepository {
  save(sale: Sale): Promise<void>;
  findById(id: string): Promise<Sale | null>;
  list(filters?: ListSalesFilters): Promise<Sale[]>;
}
