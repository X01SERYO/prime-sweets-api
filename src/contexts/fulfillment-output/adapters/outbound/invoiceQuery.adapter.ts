import { SaleRepository } from '../../../sales/application/ports/outbound/sale.repository';
import { InvoiceQuery, InvoiceSummary } from '../../application/ports/outbound/invoiceQuery.port';

export class InvoiceQueryAdapter implements InvoiceQuery {
  constructor(private readonly saleRepository: SaleRepository) {}

  async findBySalesDayId(salesDayId: string): Promise<InvoiceSummary[]> {
    const sales = await this.saleRepository.list({ salesDayId });

    return sales
      .filter(sale => (sale.isConfirmed() || sale.isVoided()) && Boolean(sale.invoiceNumber))
      .map(sale => ({
        saleId: sale.id,
        salesDayId: sale.salesDayId,
        customerId: sale.customerId,
        invoiceNumber: sale.invoiceNumber as string,
        status: sale.isVoided() ? 'VOIDED' : 'CONFIRMED',
        confirmedAt: sale.confirmedAt ? sale.confirmedAt.toISOString() : null,
        totalAmount: sale.totalAmount
      }));
  }
}
