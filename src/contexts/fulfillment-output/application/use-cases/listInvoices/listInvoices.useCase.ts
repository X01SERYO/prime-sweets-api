import { Result } from '../../../../../shared/application/result/result';
import { ListInvoicesDto } from '../../dto/listInvoices.dto';
import { InvoiceQuery, InvoiceSummary } from '../../ports/outbound/invoiceQuery.port';

export class ListInvoicesUseCase {
  constructor(private readonly invoiceQuery: InvoiceQuery) {}

  async run(dto: ListInvoicesDto): Promise<Result<InvoiceSummary[]>> {
    const invoices = await this.invoiceQuery.findByDeliveryDate(dto.deliveryDate);
    const ordered = [...invoices].sort((left, right) => compareInvoiceNumbers(left.invoiceNumber, right.invoiceNumber));

    return Result.ok(ordered);
  }
}

function compareInvoiceNumbers(left: string, right: string): number {
  const leftNumber = Number(left);
  const rightNumber = Number(right);
  if (Number.isInteger(leftNumber) && Number.isInteger(rightNumber)) {
    return rightNumber - leftNumber;
  }

  return right.localeCompare(left);
}
