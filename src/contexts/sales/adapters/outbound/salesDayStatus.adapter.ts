import { SalesDayRepository } from '../../../sales-day/application/ports/outbound/salesDay.repository';
import { SalesDayBusinessDateQuery } from '../../application/ports/outbound/salesDayBusinessDate.port';
import { SalesDayStatusChecker } from '../../application/ports/outbound/salesDayStatusChecker.port';

export class SalesDayStatusAdapter implements SalesDayStatusChecker, SalesDayBusinessDateQuery {
  constructor(private readonly salesDayRepository: SalesDayRepository) {}

  async isSalesDayOpen(salesDayId: string): Promise<boolean> {
    const salesDay = await this.salesDayRepository.findById(salesDayId);
    return salesDay ? salesDay.isOpen() : false;
  }

  async findOpenBusinessDate(salesDayId: string): Promise<string | null> {
    const salesDay = await this.salesDayRepository.findById(salesDayId);
    if (!salesDay || !salesDay.isOpen()) {
      return null;
    }

    return salesDay.date;
  }
}
