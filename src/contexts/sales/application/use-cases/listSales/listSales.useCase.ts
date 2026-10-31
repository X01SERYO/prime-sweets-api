import { Result } from '../../../../../shared/application/result/result';
import { SalePrimitives } from '../../../domain/entities/sale';
import { SaleRepository } from '../../ports/outbound/sale.repository';
import { ListSalesDto } from '../../dto/listSales.dto';

export class ListSalesUseCase {
  constructor(private readonly saleRepository: SaleRepository) {}

  async run(dto?: ListSalesDto): Promise<Result<SalePrimitives[]>> {
    const sales = await this.saleRepository.list(dto);
    const visible = dto?.deliveryDate && !dto.status ? sales.filter(sale => sale.status !== 'DRAFT') : sales;
    return Result.ok(visible.map(sale => sale.toPrimitives()));
  }
}
