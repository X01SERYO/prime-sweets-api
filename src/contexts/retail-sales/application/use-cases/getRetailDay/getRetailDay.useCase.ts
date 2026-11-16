import { Result } from '@/shared/application/result/result';
import { BusinessCalendar } from '@/shared/application/ports/businessCalendar';
import { RetailDayRepository } from '@/contexts/retail-sales/application/ports/outbound/retailDay.repository';
import { RetailReviewerQuery } from '@/contexts/retail-sales/application/ports/outbound/retailReviewerQuery.port';
import { RetailDayStatus } from '@/contexts/retail-sales/domain/entities/retailDay';
import { InvalidRetailDateError } from '@/contexts/retail-sales/domain/errors/invalidRetailDate.error';
import { RetailDayNotFoundError } from '@/contexts/retail-sales/domain/errors/retailDayNotFound.error';

export type RetailDayDetail = {
  id: string;
  businessDate: string;
  editable: boolean;
  status: RetailDayStatus;
  reviewedAt: string | null;
  reviewedByName: string | null;
  totalAmount: number;
  totalProfit: number;
  items: [];
};

export class GetRetailDayUseCase {
  constructor(
    private readonly retailDays: RetailDayRepository,
    private readonly reviewers: RetailReviewerQuery,
    private readonly calendar: BusinessCalendar
  ) {}

  async run(businessDate: string): Promise<Result<RetailDayDetail>> {
    if (!isRealDate(businessDate) || businessDate > this.calendar.today()) {
      return Result.fail(new InvalidRetailDateError(businessDate));
    }
    const today = this.calendar.today();
    await this.retailDays.compactBefore(today);
    const day = await this.retailDays.findByBusinessDate(businessDate);
    if (!day) {
      return Result.fail(new RetailDayNotFoundError(businessDate));
    }
    const reviewedByName = day.reviewedBy
      ? (await this.reviewers.findNames([day.reviewedBy])).get(day.reviewedBy) ?? null
      : null;
    return Result.ok({
      id: day.id,
      businessDate: day.businessDate,
      editable: day.isEditable(today),
      status: day.status,
      reviewedAt: day.reviewedAt?.toISOString() ?? null,
      reviewedByName,
      totalAmount: day.totalAmount,
      totalProfit: day.totalProfit,
      items: [],
    });
  }
}

function isRealDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}
