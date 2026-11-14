import { Result } from '@/shared/application/result/result';
import { SalePrimitives } from '@/contexts/sales/domain/entities/sale';
import { SaleRepository } from '@/contexts/sales/application/ports/outbound/sale.repository';
import { ListSalesDto } from '@/contexts/sales/application/dto/listSales.dto';

export class ListSalesUseCase {
  constructor(private readonly saleRepository: SaleRepository) {}

  async run(dto?: ListSalesDto): Promise<Result<SalePrimitives[]>> {
    const sales = await this.saleRepository.list(dto);
    return Result.ok(sales.map(sale => sale.toPrimitives()));
  }
}
