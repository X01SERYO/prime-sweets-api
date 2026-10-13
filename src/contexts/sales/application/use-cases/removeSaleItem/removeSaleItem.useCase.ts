import { Result } from '../../../../../shared/application/result/result';
import { SalePrimitives } from '../../../domain/entities/sale';
import { SaleRepository } from '../../ports/outbound/sale.repository';
import { SalesDayStatusChecker } from '../../ports/outbound/salesDayStatusChecker.port';
import { RemoveSaleItemDto } from '../../dto/removeSaleItem.dto';
import { SaleNotFoundError } from '../../../domain/errors/saleNotFound.error';
import { SalesDayNotOpenForSaleError } from '../../../domain/errors/salesDayNotOpenForSale.error';
import { InvalidSaleError } from '../../../domain/errors/invalidSale.error';

export class RemoveSaleItemUseCase {
  constructor(
    private readonly saleRepository: SaleRepository,
    private readonly salesDayStatusChecker: SalesDayStatusChecker
  ) {}

  async run(dto: RemoveSaleItemDto): Promise<Result<SalePrimitives>> {
    if (!dto.saleId || !dto.saleId.trim()) {
      return Result.fail(new InvalidSaleError('Sale id cannot be empty'));
    }
    if (!dto.productId || !dto.productId.trim()) {
      return Result.fail(new InvalidSaleError('Product id cannot be empty'));
    }

    const sale = await this.saleRepository.findById(dto.saleId.trim());
    if (!sale) {
      return Result.fail(new SaleNotFoundError(dto.saleId));
    }

    const isOpen = await this.salesDayStatusChecker.isSalesDayOpen(sale.salesDayId);
    if (!isOpen) {
      return Result.fail(new SalesDayNotOpenForSaleError(sale.salesDayId));
    }

    try {
      const updated = sale.removeItem(dto.productId.trim());
      await this.saleRepository.save(updated);
      return Result.ok(updated.toPrimitives());
    } catch (err) {
      return Result.fail(err as Error);
    }
  }
}
