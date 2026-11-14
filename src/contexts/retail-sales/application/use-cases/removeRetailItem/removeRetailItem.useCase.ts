import { DomainError } from '@/shared/domain/errors/domainError';
import { Result } from '@/shared/application/result/result';
import { RetailDayRepository } from '@/contexts/retail-sales/application/ports/outbound/retailDay.repository';
import { BusinessCalendar } from '@/shared/application/ports/businessCalendar';
import { RetailDayView, toRetailDayView } from '@/contexts/retail-sales/application/retailDayView';
import { RetailDayNotFoundError } from '@/contexts/retail-sales/domain/errors/retailDayNotFound.error';

export class RemoveRetailItemUseCase {
  constructor(
    private readonly retailDays: RetailDayRepository,
    private readonly calendar: BusinessCalendar
  ) {}

  async run(productId: string): Promise<Result<RetailDayView>> {
    try {
      const today = this.calendar.today();
      await this.retailDays.compactBefore(today);
      const day = await this.retailDays.findByBusinessDate(today);
      if (!day) {
        return Result.fail(new RetailDayNotFoundError(today));
      }
      const { day: updated, becameEmpty } = day.removeItem(productId, today);
      if (becameEmpty) {
        await this.retailDays.delete(updated.id);
      } else {
        await this.retailDays.save(updated);
      }
      return Result.ok(toRetailDayView(updated, today));
    } catch (error) {
      if (error instanceof DomainError) {
        return Result.fail(error);
      }
      throw error;
    }
  }
}
