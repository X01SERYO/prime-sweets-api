import { Result } from '../../../../../shared/application/result/result';
import { SalesDayPrimitives } from '../../../domain/entities/salesDay';
import { SalesDayRepository } from '../../ports/outbound/salesDay.repository';
import { BusinessDateProvider } from '../../services/businessDate.provider';
import { SalesDayNotFoundError } from '../../../domain/errors/salesDayNotFound.error';
import { ReopenSalesDayDto } from '../../dto/reopenSalesDay.dto';

export class ReopenCurrentSalesDayUseCase {
  constructor(
    private readonly salesDayRepository: SalesDayRepository,
    private readonly dateProvider: BusinessDateProvider
  ) {}

  async run(dto: ReopenSalesDayDto): Promise<Result<SalesDayPrimitives>> {
    const salesDay = await this.salesDayRepository.findById(dto.id);
    if (!salesDay) {
      return Result.fail(new SalesDayNotFoundError(dto.id));
    }

    const currentBusinessDate = this.dateProvider.getCurrentDate();

    try {
      const reopened = salesDay.reopen(currentBusinessDate);
      await this.salesDayRepository.save(reopened);
      return Result.ok(reopened.toPrimitives());
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error('Failed to reopen Sales Day'));
    }
  }
}
