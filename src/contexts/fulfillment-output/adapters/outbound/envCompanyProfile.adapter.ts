import { CompanyProfileQuery } from '../../application/ports/outbound/companyProfileQuery.port';
import { InvoiceCompanyProfile } from '../../domain/entities/invoiceDocument';

const COMPANY_FIELDS = {
  name: 'COMPANY_NAME',
  nit: 'COMPANY_NIT',
  city: 'COMPANY_CITY',
  country: 'COMPANY_COUNTRY',
  telephone: 'COMPANY_TELEPHONE',
  logo: 'COMPANY_LOGO',
  legalText: 'COMPANY_LEGAL_TEXT'
} as const;

function readEnv(name: string): string | null {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

export class EnvCompanyProfileAdapter implements CompanyProfileQuery {
  async get(): Promise<InvoiceCompanyProfile | null> {
    const name = readEnv(COMPANY_FIELDS.name);
    const nit = readEnv(COMPANY_FIELDS.nit);
    const city = readEnv(COMPANY_FIELDS.city);
    const country = readEnv(COMPANY_FIELDS.country);
    const telephone = readEnv(COMPANY_FIELDS.telephone);
    const logo = readEnv(COMPANY_FIELDS.logo);
    const legalText = readEnv(COMPANY_FIELDS.legalText);

    if (!name || !nit || !city || !country || !telephone || !logo || !legalText) {
      return null;
    }

    return { name, nit, city, country, telephone, logo, legalText };
  }
}
