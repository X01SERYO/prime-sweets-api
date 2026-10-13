import { InvoiceLineSource } from '../../../domain/entities/invoiceDocument';

export type InvoiceSaleView = {
  id: string;
  customerId: string;
  status: 'DRAFT' | 'CONFIRMED' | 'VOIDED';
  invoiceNumber: string | null;
  confirmedAt: string | null;
  lines: InvoiceLineSource[];
};

export interface InvoiceSaleQuery {
  findById(saleId: string): Promise<InvoiceSaleView | null>;
}
