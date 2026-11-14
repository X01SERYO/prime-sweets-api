import { RetailDay, RetailDayStatus } from '@/contexts/retail-sales/domain/entities/retailDay';

export interface RetailDayRepository {
  compactBefore(today: string): Promise<void>;
  findByBusinessDate(businessDate: string): Promise<RetailDay | null>;
  insertIfAbsent(day: RetailDay): Promise<RetailDay>;
  save(day: RetailDay): Promise<void>;
  saveAll(days: RetailDay[]): Promise<void>;
  delete(id: string): Promise<void>;
  listByStatus(
    status: RetailDayStatus,
    page: number,
    pageSize: number
  ): Promise<{ items: RetailDay[]; total: number }>;
}
