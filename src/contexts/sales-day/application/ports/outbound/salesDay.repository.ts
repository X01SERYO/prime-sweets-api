import { SalesDay } from '../../../domain/entities/salesDay';

export interface SalesDayRepository {
  findById(id: string): Promise<SalesDay | null>;
  findBySellerAndDate(sellerId: string, date: string): Promise<SalesDay | null>;
  findBySellerBetween(sellerId: string, fromDate: string, toDate: string): Promise<SalesDay[]>;
  findActiveBySeller(sellerId: string): Promise<SalesDay | null>;
  save(salesDay: SalesDay): Promise<void>;
}
