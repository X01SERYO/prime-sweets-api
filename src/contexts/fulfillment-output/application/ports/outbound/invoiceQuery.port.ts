export type InvoiceSummary = {
  saleId: string;
  salesDayId: string;
  customerId: string;
  invoiceNumber: string;
  status: 'CONFIRMED' | 'VOIDED';
  confirmedAt: string | null;
  totalAmount: number;
};

export interface InvoiceQuery {
  findBySalesDayId(salesDayId: string): Promise<InvoiceSummary[]>;
}
