import { SaleRepository } from '../../../sales/application/ports/outbound/sale.repository';
import { InvoiceSaleQuery, InvoiceSaleView } from '../../application/ports/outbound/invoiceSaleQuery.port';

export class InvoiceSaleAdapter implements InvoiceSaleQuery {
  constructor(private readonly saleRepository: SaleRepository) {}

  async findById(saleId: string): Promise<InvoiceSaleView | null> {
    const sale = await this.saleRepository.findById(saleId);
    if (!sale) {
      return null;
    }

    const primitives = sale.toPrimitives();
    return {
      id: primitives.id,
      customerId: primitives.customerId,
      status: primitives.status,
      invoiceNumber: primitives.invoiceNumber,
      confirmedAt: primitives.confirmedAt,
      lines: primitives.items.map(item => ({
        productId: item.productId,
        itemName: item.itemName,
        quantity: item.quantity,
        unitValue: item.wholesalePrice,
        totalValue: item.totalPrice
      }))
    };
  }
}
