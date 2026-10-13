import { Result } from '../../../../../shared/application/result/result';
import { InvoiceDocument, InvoiceDocumentPrimitives } from '../../../domain/entities/invoiceDocument';
import { CompanyProfileNotConfiguredError } from '../../../domain/errors/companyProfileNotConfigured.error';
import { CustomerNotFoundForInvoiceError } from '../../../domain/errors/customerNotFoundForInvoice.error';
import { InvoiceNumberMissingError } from '../../../domain/errors/invoiceNumberMissing.error';
import { InvoiceSaleDateMissingError } from '../../../domain/errors/invoiceSaleDateMissing.error';
import { SaleNotFoundForInvoiceError } from '../../../domain/errors/saleNotFoundForInvoice.error';
import { SaleNotInvoiceableError } from '../../../domain/errors/saleNotInvoiceable.error';
import { GenerateInvoiceDto } from '../../dto/generateInvoice.dto';
import { CompanyProfileQuery } from '../../ports/outbound/companyProfileQuery.port';
import { InvoiceCustomerQuery } from '../../ports/outbound/invoiceCustomerQuery.port';
import { InvoiceSaleQuery } from '../../ports/outbound/invoiceSaleQuery.port';

export class GenerateInvoiceUseCase {
  constructor(
    private readonly invoiceSaleQuery: InvoiceSaleQuery,
    private readonly invoiceCustomerQuery: InvoiceCustomerQuery,
    private readonly companyProfileQuery: CompanyProfileQuery
  ) {}

  async run(dto: GenerateInvoiceDto): Promise<Result<InvoiceDocumentPrimitives>> {
    const sale = await this.invoiceSaleQuery.findById(dto.saleId);
    if (!sale) {
      return Result.fail(new SaleNotFoundForInvoiceError(dto.saleId));
    }

    if (sale.status !== 'CONFIRMED') {
      return Result.fail(new SaleNotInvoiceableError(sale.id, sale.status));
    }

    if (!sale.invoiceNumber) {
      return Result.fail(new InvoiceNumberMissingError(sale.id));
    }

    if (!sale.confirmedAt) {
      return Result.fail(new InvoiceSaleDateMissingError(sale.id));
    }

    const customer = await this.invoiceCustomerQuery.findById(sale.customerId);
    if (!customer) {
      return Result.fail(new CustomerNotFoundForInvoiceError(sale.customerId));
    }

    const company = await this.companyProfileQuery.get();
    if (!company) {
      return Result.fail(new CompanyProfileNotConfiguredError());
    }

    const document = InvoiceDocument.compose({
      company,
      customer,
      invoiceNumber: sale.invoiceNumber,
      saleDate: sale.confirmedAt,
      lines: sale.lines
    });

    return Result.ok(document.toPrimitives());
  }
}
