import { InvoiceCompanyProfile } from '../../../domain/entities/invoiceDocument';

export interface CompanyProfileQuery {
  get(): Promise<InvoiceCompanyProfile | null>;
}
