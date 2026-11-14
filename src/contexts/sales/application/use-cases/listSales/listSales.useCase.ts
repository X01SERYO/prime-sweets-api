import { Result } from '@shared/application/result/result';
import { SalePrimitives } from '@sales/domain/entities/sale';
import { SaleRepository } from '@sales/application/ports/outbound/sale.repository';
import { ListSalesDto } from '@sales/application/dto/listSales.dto';

export class ListSalesUseCase {
  constructor(private readonly saleRepository: SaleRepository) {}

  async run(dto?: ListSalesDto): Promise<Result<SalePrimitives[]>> {
    const sales = await this.saleRepository.list(dto);
    return Result.ok(sales.map(sale => sale.toPrimitives()));
  }
}
