import { Result } from '../../../../../shared/application/result/result';
import { SalesDayPrimitives } from '../../../domain/entities/salesDay';
import { SalesDayRepository } from '../../ports/outbound/salesDay.repository';
import { BusinessDateProvider } from '../../services/businessDate.provider';
import { InvalidSalesDayError } from '../../../domain/errors/invalidSalesDay.error';
import { SalesDayNotFoundError } from '../../../domain/errors/salesDayNotFound.error';
import { GetCurrentSalesDayDto } from '../../dto/getCurrentSalesDay.dto';

export class GetCurrentSalesDayUseCase {
  constructor(
    private readonly salesDayRepository: SalesDayRepository,
    private readonly dateProvider: BusinessDateProvider
  ) {}

  async run(dto: GetCurrentSalesDayDto): Promise<Result<SalesDayPrimitives>> {
    const sellerId = dto.sellerId?.trim();
    if (!sellerId) {
      return Result.fail(new InvalidSalesDayError('Sales Day sellerId cannot be empty'));
    }

    const targetDate = dto.date?.trim() || this.dateProvider.getCurrentDate();

    const salesDay = await this.salesDayRepository.findBySellerAndDate(sellerId, targetDate);
    if (!salesDay) {
      return Result.fail(new SalesDayNotFoundError(`Sales Day for seller "${sellerId}" on date "${targetDate}" was not found`));
    }

    return Result.ok(salesDay.toPrimitives());
  }
}
