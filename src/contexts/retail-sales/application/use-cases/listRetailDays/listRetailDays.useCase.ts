import { Result } from '@/shared/application/result/result';
import { BusinessCalendar } from '@/shared/application/ports/businessCalendar';
import { RetailDayRepository } from '@/contexts/retail-sales/application/ports/outbound/retailDay.repository';
import { RetailReviewerQuery } from '@/contexts/retail-sales/application/ports/outbound/retailReviewerQuery.port';
import { RetailDayStatus } from '@/contexts/retail-sales/domain/entities/retailDay';

export type RetailDaySummary = {
  businessDate: string;
  status: RetailDayStatus;
  totalAmount: number;
  totalProfit: number;
  reviewedAt: string | null;
  reviewedByName: string | null;
};

export type ListRetailDaysDto = {
  status: RetailDayStatus;
  page?: number;
  pageSize?: number;
};

export class ListRetailDaysUseCase {
  constructor(
    private readonly retailDays: RetailDayRepository,
    private readonly reviewers: RetailReviewerQuery,
    private readonly calendar: BusinessCalendar
  ) {}

  async run(dto: ListRetailDaysDto): Promise<Result<{ items: RetailDaySummary[]; total: number; page: number; pageSize: number }>> {
    const page = dto.page ?? 1;
    const pageSize = dto.pageSize ?? 10;
    const today = this.calendar.today();
    await this.retailDays.compactBefore(today);
    const listed = await this.retailDays.listByStatus(dto.status, page, pageSize);
    const names = await this.reviewers.findNames(
      listed.items.map((day) => day.reviewedBy).filter((id): id is string => id !== null)
    );
    return Result.ok({
      items: listed.items.map((day) => ({
        businessDate: day.businessDate,
        status: day.status,
        totalAmount: day.totalAmount,
        totalProfit: day.totalProfit,
        reviewedAt: day.reviewedAt?.toISOString() ?? null,
        reviewedByName: day.reviewedBy ? names.get(day.reviewedBy) ?? null : null,
      })),
      total: listed.total,
      page,
      pageSize,
    });
  }
}
