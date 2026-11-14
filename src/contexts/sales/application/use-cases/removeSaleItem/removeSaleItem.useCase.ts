import { Result } from '@shared/application/result/result';
import { SalePrimitives } from '@sales/domain/entities/sale';
import { SaleRepository } from '@sales/application/ports/outbound/sale.repository';
import { RemoveSaleItemDto } from '@sales/application/dto/removeSaleItem.dto';
import { SaleNotFoundError } from '@sales/domain/errors/saleNotFound.error';
import { InvalidSaleError } from '@sales/domain/errors/invalidSale.error';

export class RemoveSaleItemUseCase {
  constructor(
    private readonly saleRepository: SaleRepository
  ) {}

  async run(dto: RemoveSaleItemDto): Promise<Result<SalePrimitives>> {
    if (!dto.saleId || !dto.saleId.trim()) {
      return Result.fail(new InvalidSaleError('Sale id cannot be empty'));
    }
    if (!dto.itemId || !dto.itemId.trim()) {
      return Result.fail(new InvalidSaleError('Sale item id cannot be empty'));
    }

    const sale = await this.saleRepository.findById(dto.saleId.trim());
    if (!sale) {
      return Result.fail(new SaleNotFoundError(dto.saleId));
    }

    try {
      const updated = sale.removeItem(dto.itemId.trim());
      await this.saleRepository.save(updated);
      return Result.ok(updated.toPrimitives());
    } catch (err) {
      return Result.fail(err as Error);
    }
  }
}
