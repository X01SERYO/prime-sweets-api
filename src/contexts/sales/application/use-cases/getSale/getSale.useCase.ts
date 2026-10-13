import { Result } from '../../../../../shared/application/result/result';
import { SalePrimitives } from '../../../domain/entities/sale';
import { SaleRepository } from '../../ports/outbound/sale.repository';
import { SaleNotFoundError } from '../../../domain/errors/saleNotFound.error';
import { InvalidSaleError } from '../../../domain/errors/invalidSale.error';

export class GetSaleUseCase {
  constructor(private readonly saleRepository: SaleRepository) {}

  async run(id: string): Promise<Result<SalePrimitives>> {
    if (!id || !id.trim()) {
      return Result.fail(new InvalidSaleError('Sale id cannot be empty'));
    }

    const sale = await this.saleRepository.findById(id.trim());
    if (!sale) {
      return Result.fail(new SaleNotFoundError(id.trim()));
    }

    return Result.ok(sale.toPrimitives());
  }
}
