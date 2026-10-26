import { SaleRepository } from '../../../contexts/sales/application/ports/outbound/sale.repository';
import { ConfirmedSaleItemContribution } from '../../../contexts/fulfillment-output/domain/entities/loadSheet';
import { ConfirmedSaleItemsQuery } from '../../../contexts/fulfillment-output/application/ports/outbound/confirmedSaleItemsQuery.port';

export class ConfirmedSaleItemsAdapter implements ConfirmedSaleItemsQuery {
  constructor(private readonly saleRepository: SaleRepository) {}

  async findConfirmedBySalesDayId(salesDayId: string): Promise<ConfirmedSaleItemContribution[]> {
    const sales = await this.saleRepository.list({ salesDayId, status: 'CONFIRMED' });

    return sales
      .filter((sale) => sale.isConfirmed())
      .flatMap((sale) =>
        sale.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          wholesaleCost: item.wholesaleCost,
          wholesaleSalePrice: item.wholesalePrice,
          totalPrice: item.totalPrice,
          profit: item.profit
        }))
      );
  }
}
