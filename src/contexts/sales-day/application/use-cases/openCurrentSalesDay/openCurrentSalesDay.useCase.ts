import { randomUUID } from 'crypto';
import { Result } from '../../../../../shared/application/result/result';
import { SalesDay, SalesDayPrimitives } from '../../../domain/entities/salesDay';
import { SalesDayRepository } from '../../ports/outbound/salesDay.repository';
import { BusinessDateProvider } from '../../services/businessDate.provider';
import { InvalidSalesDayError } from '../../../domain/errors/invalidSalesDay.error';
import { SalesDayAlreadyOpenError } from '../../../domain/errors/salesDayAlreadyOpenError';
import { OpenSalesDayDto } from '../../dto/openSalesDay.dto';

export class OpenCurrentSalesDayUseCase {
  constructor(
    private readonly salesDayRepository: SalesDayRepository,
    private readonly dateProvider: BusinessDateProvider
  ) {}

  async run(dto: OpenSalesDayDto): Promise<Result<SalesDayPrimitives>> {
    const sellerId = dto.sellerId?.trim();
    if (!sellerId) {
      return Result.fail(new InvalidSalesDayError('Sales Day sellerId cannot be empty'));
    }

    const targetDate = dto.date?.trim() || this.dateProvider.getCurrentDate();

    const existing = await this.salesDayRepository.findBySellerAndDate(sellerId, targetDate);
    if (existing) {
      if (existing.isOpen()) {
        return Result.fail(new SalesDayAlreadyOpenError(`Sales Day for seller "${sellerId}" and date "${targetDate}" is already open`));
      }
      return Result.fail(new InvalidSalesDayError(`Sales Day for seller "${sellerId}" and date "${targetDate}" already exists and is closed`));
    }

    const salesDay = SalesDay.create({
      id: randomUUID(),
      sellerId,
      date: targetDate
    });

    await this.salesDayRepository.save(salesDay);

    return Result.ok(salesDay.toPrimitives());
  }
}
