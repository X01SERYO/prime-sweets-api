import { Result } from '../../../../../shared/application/result/result';
import { SalePrimitives } from '../../../domain/entities/sale';
import { SaleRepository } from '../../ports/outbound/sale.repository';
import { VoidSaleDto } from '../../dto/voidSale.dto';
import { SaleNotFoundError } from '../../../domain/errors/saleNotFound.error';
import { InvalidSaleError } from '../../../domain/errors/invalidSale.error';

export class VoidSaleUseCase {
  constructor(
    private readonly saleRepository: SaleRepository
  ) {}

  async run(dto: VoidSaleDto): Promise<Result<SalePrimitives>> {
    if (!dto.saleId || !dto.saleId.trim()) {
      return Result.fail(new InvalidSaleError('Sale id cannot be empty'));
    }

    const sale = await this.saleRepository.findById(dto.saleId.trim());
    if (!sale) {
      return Result.fail(new SaleNotFoundError(dto.saleId));
    }

    try {
      const voided = sale.void();
      await this.saleRepository.save(voided);

      return Result.ok(voided.toPrimitives());
    } catch (err) {
      return Result.fail(err as Error);
    }
  }
}
