import { Result } from '@/shared/application/result/result';
import { BusinessCalendar } from '@/shared/application/ports/businessCalendar';
import { RetailDayRepository } from '@/contexts/retail-sales/application/ports/outbound/retailDay.repository';
import { RetailDay, RetailDayStatus } from '@/contexts/retail-sales/domain/entities/retailDay';
import { RetailDayAlreadyReviewedError } from '@/contexts/retail-sales/domain/errors/retailDayAlreadyReviewed.error';
import { RetailDayNotFoundError } from '@/contexts/retail-sales/domain/errors/retailDayNotFound.error';

export type ReviewRetailDaysDto = {
  dates: string[];
  reviewerId: string;
};

export class ReviewRetailDaysUseCase {
  constructor(
    private readonly retailDays: RetailDayRepository,
    private readonly calendar: BusinessCalendar
  ) {}

  async run(dto: ReviewRetailDaysDto): Promise<Result<{ reviewed: number; totalAmount: number; totalProfit: number }>> {
    const today = this.calendar.today();
    await this.retailDays.compactBefore(today);
    const dates = [...new Set(dto.dates)];
    const found: RetailDay[] = [];
    const missing: string[] = [];
    const alreadyReviewed: string[] = [];

    for (const date of dates) {
      const day = await this.retailDays.findByBusinessDate(date);
      if (!day) {
        missing.push(date);
      } else if (day.status === RetailDayStatus.Reviewed) {
        alreadyReviewed.push(date);
      } else {
        found.push(day);
      }
    }

    if (missing.length > 0) {
      return Result.fail(new RetailDayNotFoundError(missing));
    }
    if (alreadyReviewed.length > 0) {
      return Result.fail(new RetailDayAlreadyReviewedError(alreadyReviewed));
    }

    const now = new Date();
    const reviewed = found.map((day) => day.review(dto.reviewerId, now));
    await this.retailDays.saveAll(reviewed);
    const totalAmount = roundMoney(reviewed.reduce((sum, day) => sum + day.totalAmount, 0));
    const totalProfit = roundMoney(reviewed.reduce((sum, day) => sum + day.totalProfit, 0));
    return Result.ok({ reviewed: reviewed.length, totalAmount, totalProfit });
  }
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
