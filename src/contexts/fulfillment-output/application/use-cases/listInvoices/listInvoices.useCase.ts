import { Result } from '../../../../../shared/application/result/result';
import { SalesDayNotFoundForInvoiceError } from '../../../domain/errors/salesDayNotFoundForInvoice.error';
import { ListInvoicesDto } from '../../dto/listInvoices.dto';
import { InvoiceQuery, InvoiceSummary } from '../../ports/outbound/invoiceQuery.port';
import { SalesDayClosureQuery } from '../../ports/outbound/salesDayClosureQuery.port';

export class ListInvoicesUseCase {
  constructor(
    private readonly salesDayClosureQuery: SalesDayClosureQuery,
    private readonly invoiceQuery: InvoiceQuery
  ) {}

  async run(dto: ListInvoicesDto): Promise<Result<InvoiceSummary[]>> {
    const salesDay = await this.salesDayClosureQuery.findById(dto.salesDayId);
    if (!salesDay) {
      return Result.fail(new SalesDayNotFoundForInvoiceError(dto.salesDayId));
    }

    const invoices = await this.invoiceQuery.findBySalesDayId(dto.salesDayId);
    const ordered = [...invoices].sort((left, right) => left.invoiceNumber.localeCompare(right.invoiceNumber));

    return Result.ok(ordered);
  }
}
