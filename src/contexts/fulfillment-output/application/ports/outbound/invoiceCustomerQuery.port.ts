import { InvoiceCustomerView } from '@/contexts/fulfillment-output/domain/entities/invoiceDocument';

export interface InvoiceCustomerQuery {
  findById(customerId: string): Promise<InvoiceCustomerView | null>;
}
