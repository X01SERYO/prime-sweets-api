import { Sale } from '@sales/domain/entities/sale';

export interface SaleBatch {
  saveAll(sales: Sale[]): Promise<void>;
}
