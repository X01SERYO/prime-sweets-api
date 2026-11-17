import { Sale } from '@/contexts/sales/domain/entities/sale';

export interface SaleBatch {
  saveAll(sales: Sale[]): Promise<void>;
  discard(saleId: string): Promise<void>;
}
