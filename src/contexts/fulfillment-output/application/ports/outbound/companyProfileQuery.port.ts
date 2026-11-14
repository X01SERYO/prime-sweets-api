import { InvoiceCompanyProfile } from '@/contexts/fulfillment-output/domain/entities/invoiceDocument';

export interface CompanyProfileQuery {
  get(): Promise<InvoiceCompanyProfile | null>;
}
