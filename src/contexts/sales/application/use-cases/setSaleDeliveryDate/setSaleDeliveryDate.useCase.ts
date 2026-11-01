import { Result } from '../../../../../shared/application/result/result';
import { SalePrimitives } from '../../../domain/entities/sale';
import { SaleNotFoundError } from '../../../domain/errors/saleNotFound.error';
import { InvalidSaleError } from '../../../domain/errors/invalidSale.error';
import { SetSaleDeliveryDateDto } from '../../dto/setSaleDeliveryDate.dto';
import { SaleRepository } from '../../ports/outbound/sale.repository';
import { BusinessCalendar } from '../../ports/outbound/businessCalendar.port';

export class SetSaleDeliveryDateUseCase {
  constructor(
    private readonly saleRepository: SaleRepository,
    private readonly calendar: BusinessCalendar
  ) {}

  async run(dto: SetSaleDeliveryDateDto): Promise<Result<SalePrimitives>> {
    if (!dto.saleId || !dto.saleId.trim()) {
      return Result.fail(new InvalidSaleError('Sale id cannot be empty'));
    }

    const sale = await this.saleRepository.findById(dto.saleId.trim());
    if (!sale) {
      return Result.fail(new SaleNotFoundError(dto.saleId));
    }

    try {
      const updated = sale.setDeliveryDate(dto.deliveryDate, this.calendar.today());
      await this.saleRepository.save(updated);
      return Result.ok(updated.toPrimitives());
    } catch (error) {
      return Result.fail(error as Error);
    }
  }
}
