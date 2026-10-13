import { SalesDayRepository } from '../../../sales-day/application/ports/outbound/salesDay.repository';
import { SalesDayStatusChecker } from '../../application/ports/outbound/salesDayStatusChecker.port';

export class SalesDayStatusAdapter implements SalesDayStatusChecker {
  constructor(private readonly salesDayRepository: SalesDayRepository) {}

  async isSalesDayOpen(salesDayId: string): Promise<boolean> {
    const salesDay = await this.salesDayRepository.findById(salesDayId);
    return salesDay ? salesDay.isOpen() : false;
  }
}
