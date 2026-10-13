import { InvoiceCustomerView } from '../../../domain/entities/invoiceDocument';

export interface InvoiceCustomerQuery {
  findById(customerId: string): Promise<InvoiceCustomerView | null>;
}
