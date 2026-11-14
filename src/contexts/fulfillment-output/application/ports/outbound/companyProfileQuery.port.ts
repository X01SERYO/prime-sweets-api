import { InvoiceCompanyProfile } from '@fulfillment-output/domain/entities/invoiceDocument';

export interface CompanyProfileQuery {
  get(): Promise<InvoiceCompanyProfile | null>;
}
