export const SIMPLIFIED_TAX_REGIME = 'Régimen simplificado';

export type InvoiceCompanyProfile = {
  name: string;
  nit: string;
  city: string;
  country: string;
  telephone: string;
  logo: string;
  legalText: string;
};

export type InvoiceCustomerView = {
  documentType: string;
  documentNumber: string;
  name: string;
};

export type InvoiceLineSource = {
  productId: string;
  itemName: string;
  quantity: number;
  unitValue: number;
  totalValue: number;
};

export type InvoiceLinePrimitives = {
  productId: string;
  productName: string;
  quantity: number;
  unitValue: number;
  totalValue: number;
};

export type InvoiceDocumentPrimitives = {
  companyName: string;
  companyNit: string;
  city: string;
  country: string;
  telephone: string;
  logo: string;
  taxRegime: typeof SIMPLIFIED_TAX_REGIME;
  legalText: string;
  customerDocumentType: string;
  customerDocumentNumber: string;
  customerName: string;
  invoiceNumber: string;
  saleDate: string;
  lines: InvoiceLinePrimitives[];
  subtotal: number;
  total: number;
};

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export class InvoiceDocument {
  private constructor(private readonly primitives: InvoiceDocumentPrimitives) {}

  static compose(params: {
    company: InvoiceCompanyProfile;
    customer: InvoiceCustomerView;
    invoiceNumber: string;
    saleDate: string;
    lines: InvoiceLineSource[];
  }): InvoiceDocument {
    const lines = params.lines.map(line => ({
      productId: line.productId,
      productName: line.itemName,
      quantity: line.quantity,
      unitValue: line.unitValue,
      totalValue: line.totalValue
    }));
    const subtotal = roundMoney(lines.reduce((sum, line) => sum + line.totalValue, 0));

    return new InvoiceDocument({
      companyName: params.company.name,
      companyNit: params.company.nit,
      city: params.company.city,
      country: params.company.country,
      telephone: params.company.telephone,
      logo: params.company.logo,
      taxRegime: SIMPLIFIED_TAX_REGIME,
      legalText: params.company.legalText,
      customerDocumentType: params.customer.documentType,
      customerDocumentNumber: params.customer.documentNumber,
      customerName: params.customer.name,
      invoiceNumber: params.invoiceNumber,
      saleDate: params.saleDate,
      lines,
      subtotal,
      total: subtotal
    });
  }

  toPrimitives(): InvoiceDocumentPrimitives {
    return {
      ...this.primitives,
      lines: this.primitives.lines.map(line => ({ ...line }))
    };
  }
}
