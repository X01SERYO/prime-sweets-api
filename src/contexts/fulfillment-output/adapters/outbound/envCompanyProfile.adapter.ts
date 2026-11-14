import { getAppConfig } from '@/shared/infrastructure/config/appConfig';
import { CompanyProfileQuery } from '@/contexts/fulfillment-output/application/ports/outbound/companyProfileQuery.port';
import { InvoiceCompanyProfile } from '@/contexts/fulfillment-output/domain/entities/invoiceDocument';

export class EnvCompanyProfileAdapter implements CompanyProfileQuery {
  async get(): Promise<InvoiceCompanyProfile | null> {
    const company = getAppConfig().company;
    if (
      !company.name ||
      !company.nit ||
      !company.city ||
      !company.country ||
      !company.telephone ||
      !company.logo ||
      !company.legalText
    ) {
      return null;
    }

    return company;
  }
}
