import { SalesDayRepository } from '../../../contexts/sales-day/application/ports/outbound/salesDay.repository';
import { BusinessDateProvider } from '../../../contexts/sales-day/application/services/businessDate.provider';
import { isInsideEditWindow } from '../../../contexts/sales-day/domain/currentWeek';
import { SalesDayEditGate, SalesDayStatusChecker } from '../../../contexts/sales/application/ports/outbound/salesDayStatusChecker.port';

export class SalesDayStatusAdapter implements SalesDayStatusChecker {
  constructor(
    private readonly salesDayRepository: SalesDayRepository,
    private readonly dates: BusinessDateProvider
  ) {}

  async findForEdit(salesDayId: string): Promise<SalesDayEditGate> {
    const salesDay = await this.salesDayRepository.findById(salesDayId);
    if (!salesDay) {
      return { kind: 'missing' };
    }
    if (!isInsideEditWindow(salesDay.date, this.dates.getCurrentDate())) {
      return { kind: 'outside' };
    }
    if (salesDay.status !== 'OPEN') {
      return { kind: 'closed' };
    }
    return { kind: 'editable', date: salesDay.date };
  }
}
