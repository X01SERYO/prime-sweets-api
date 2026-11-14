import { RetailProductSnapshot } from '@/contexts/retail-sales/domain/entities/retailDayItem';

export interface RetailProductSnapshotProvider {
  getSnapshot(productId: string): Promise<RetailProductSnapshot | null>;
}
