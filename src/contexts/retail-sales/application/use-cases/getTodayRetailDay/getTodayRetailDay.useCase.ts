import { Result } from '@/shared/application/result/result';
import { BusinessCalendar } from '@/shared/application/ports/businessCalendar';
import { RetailDayRepository } from '@/contexts/retail-sales/application/ports/outbound/retailDay.repository';
import { RetailDayView, toRetailDayView } from '@/contexts/retail-sales/application/retailDayView';
import { RetailDayStatus } from '@/contexts/retail-sales/domain/entities/retailDay';

export class GetTodayRetailDayUseCase {
  constructor(
    private readonly retailDays: RetailDayRepository,
    private readonly calendar: BusinessCalendar
  ) {}

  async run(): Promise<Result<RetailDayView>> {
    const today = this.calendar.today();
    await this.retailDays.compactBefore(today);
    const day = await this.retailDays.findByBusinessDate(today);
    if (!day) {
      return Result.ok({
        id: null,
        businessDate: today,
        editable: true,
        status: RetailDayStatus.Unreviewed,
        reviewedAt: null,
        totalAmount: 0,
        totalProfit: 0,
        items: [],
      });
    }
    return Result.ok(toRetailDayView(day, today));
  }
}
