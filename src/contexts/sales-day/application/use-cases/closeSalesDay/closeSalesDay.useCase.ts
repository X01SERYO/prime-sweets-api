import { Result } from '../../../../../shared/application/result/result';
import { SalesDayPrimitives } from '../../../domain/entities/salesDay';
import { SalesDayRepository } from '../../ports/outbound/salesDay.repository';
import { SalesDayNotFoundError } from '../../../domain/errors/salesDayNotFound.error';
import { CloseSalesDayDto } from '../../dto/closeSalesDay.dto';

export class CloseSalesDayUseCase {
  constructor(private readonly salesDayRepository: SalesDayRepository) {}

  async run(dto: CloseSalesDayDto): Promise<Result<SalesDayPrimitives>> {
    const salesDay = await this.salesDayRepository.findById(dto.id);
    if (!salesDay) {
      return Result.fail(new SalesDayNotFoundError(dto.id));
    }

    try {
      const closed = salesDay.close();
      await this.salesDayRepository.save(closed);
      return Result.ok(closed.toPrimitives());
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error('Failed to close Sales Day'));
    }
  }
}
