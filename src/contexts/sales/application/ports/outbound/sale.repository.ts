import { Sale } from '../../../domain/entities/sale';

export type ListSalesFilters = {
  salesDayId?: string;
  customerId?: string;
  status?: 'DRAFT' | 'CONFIRMED' | 'VOIDED';
};

export interface SaleRepository {
  save(sale: Sale): Promise<void>;
  findById(id: string): Promise<Sale | null>;
  findBySalesDayId(salesDayId: string): Promise<Sale[]>;
  list(filters?: ListSalesFilters): Promise<Sale[]>;
}
