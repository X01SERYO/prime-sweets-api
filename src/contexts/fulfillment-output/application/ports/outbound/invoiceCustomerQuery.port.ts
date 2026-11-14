import { InvoiceCustomerView } from '@fulfillment-output/domain/entities/invoiceDocument';

export interface InvoiceCustomerQuery {
  findById(customerId: string): Promise<InvoiceCustomerView | null>;
}
