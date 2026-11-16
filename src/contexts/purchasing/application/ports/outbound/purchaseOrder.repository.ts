import { PurchaseOrder } from '@/contexts/purchasing/domain/entities/purchaseOrder';
import { Supplier } from '@/contexts/purchasing/domain/entities/supplier';

export type PurchaseOrderHeader = {
  id: string;
  supplierId: string;
  supplierName: string;
  createdAt: Date;
  lineCount: number;
  totalCost: number;
  hasLines: boolean;
};

export interface PurchaseOrderRepository {
  save(order: PurchaseOrder, supplier: Supplier): Promise<void>;
  findById(id: string): Promise<PurchaseOrder | null>;
  list(supplierId: string, page: number, pageSize: number): Promise<{ items: PurchaseOrderHeader[]; total: number }>;
}
