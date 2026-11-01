import { Sale } from '../../../domain/entities/sale';

export interface SaleBatch {
  saveAll(sales: Sale[]): Promise<void>;
}
