export type InvoiceSummary = {
  saleId: string;
  deliveryDate: string;
  customerId: string;
  invoiceNumber: string;
  status: 'CONFIRMED' | 'VOIDED';
  confirmedAt: string | null;
  totalAmount: number;
};

export interface InvoiceQuery {
  findByDeliveryDate(deliveryDate: string): Promise<InvoiceSummary[]>;
}
