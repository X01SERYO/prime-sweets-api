import { SalesDay } from '../../../domain/entities/salesDay';

export interface SalesDayRepository {
  findById(id: string): Promise<SalesDay | null>;
  findBySellerAndDate(sellerId: string, date: string): Promise<SalesDay | null>;
  findActiveBySeller(sellerId: string): Promise<SalesDay | null>;
  save(salesDay: SalesDay): Promise<void>;
}
