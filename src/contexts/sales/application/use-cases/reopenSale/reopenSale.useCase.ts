import { Result } from '@/shared/application/result/result';
import { SalePrimitives } from '@/contexts/sales/domain/entities/sale';
import { SaleRepository } from '@/contexts/sales/application/ports/outbound/sale.repository';
import { SaleNotFoundError } from '@/contexts/sales/domain/errors/saleNotFound.error';
import { InvalidSaleError } from '@/contexts/sales/domain/errors/invalidSale.error';

export class ReopenSaleUseCase {
  constructor(private readonly saleRepository: SaleRepository) {}

  async run(saleId: string): Promise<Result<SalePrimitives>> {
    if (!saleId || !saleId.trim()) {
      return Result.fail(new InvalidSaleError('Sale id cannot be empty'));
    }

    const sale = await this.saleRepository.findById(saleId.trim());
    if (!sale) {
      return Result.fail(new SaleNotFoundError(saleId));
    }

    try {
      const draft = sale.reopen();
      await this.saleRepository.save(draft);
      return Result.ok(draft.toPrimitives());
    } catch (error) {
      return Result.fail(error as Error);
    }
  }
}
