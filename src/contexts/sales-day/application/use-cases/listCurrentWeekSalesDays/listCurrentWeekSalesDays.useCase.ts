import { Result } from '../../../../../shared/application/result/result';
import { SalesDayPrimitives } from '../../../domain/entities/salesDay';
import { currentWeekBounds } from '../../../domain/currentWeek';
import { InvalidSalesDayError } from '../../../domain/errors/invalidSalesDay.error';
import { ListCurrentWeekSalesDaysDto } from '../../dto/listCurrentWeekSalesDays.dto';
import { SalesDayRepository } from '../../ports/outbound/salesDay.repository';
import { BusinessDateProvider } from '../../services/businessDate.provider';

export class ListCurrentWeekSalesDaysUseCase {
  constructor(
    private readonly salesDayRepository: SalesDayRepository,
    private readonly dateProvider: BusinessDateProvider
  ) {}

  async run(dto: ListCurrentWeekSalesDaysDto): Promise<Result<SalesDayPrimitives[]>> {
    const sellerId = dto.sellerId?.trim();
    if (!sellerId) {
      return Result.fail(new InvalidSalesDayError('Sales Day sellerId cannot be empty'));
    }

    const currentDate = this.dateProvider.getCurrentDate();
    let fromDate: string;
    let toDate: string;
    try {
      const bounds = currentWeekBounds(currentDate);
      fromDate = bounds.weekStart;
      toDate = bounds.through;
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new InvalidSalesDayError('Sales Day date is invalid'));
    }

    const days = await this.salesDayRepository.findBySellerBetween(sellerId, fromDate, toDate);
    const ordered = [...days].sort((left, right) => (left.date < right.date ? 1 : left.date > right.date ? -1 : 0));
    return Result.ok(ordered.map(day => day.toPrimitives()));
  }
}
