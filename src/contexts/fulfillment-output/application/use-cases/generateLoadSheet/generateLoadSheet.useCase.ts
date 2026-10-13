import { Result } from '../../../../../shared/application/result/result';
import { LoadSheet, LoadSheetPrimitives } from '../../../domain/entities/loadSheet';
import { SalesDayNotClosedError } from '../../../domain/errors/salesDayNotClosed.error';
import { SalesDayNotFoundForLoadSheetError } from '../../../domain/errors/salesDayNotFoundForLoadSheet.error';
import { GenerateLoadSheetDto } from '../../dto/generateLoadSheet.dto';
import { CatalogProductDisplayQuery } from '../../ports/outbound/catalogProductDisplayQuery.port';
import { ConfirmedSaleItemsQuery } from '../../ports/outbound/confirmedSaleItemsQuery.port';
import { SalesDayClosureQuery } from '../../ports/outbound/salesDayClosureQuery.port';

export class GenerateLoadSheetUseCase {
  constructor(
    private readonly salesDayClosureQuery: SalesDayClosureQuery,
    private readonly confirmedSaleItemsQuery: ConfirmedSaleItemsQuery,
    private readonly catalogProductDisplayQuery: CatalogProductDisplayQuery
  ) {}

  async run(dto: GenerateLoadSheetDto): Promise<Result<LoadSheetPrimitives>> {
    const salesDay = await this.salesDayClosureQuery.findById(dto.salesDayId);
    if (!salesDay) {
      return Result.fail(new SalesDayNotFoundForLoadSheetError(dto.salesDayId));
    }

    if (salesDay.status !== 'CLOSED') {
      return Result.fail(new SalesDayNotClosedError(dto.salesDayId));
    }

    const contributions = await this.confirmedSaleItemsQuery.findConfirmedBySalesDayId(dto.salesDayId);
    const productIds = [...new Set(contributions.map((contribution) => contribution.productId))];
    const displays = await this.catalogProductDisplayQuery.findByProductIds(productIds);

    try {
      const loadSheet = LoadSheet.compose({
        salesDayId: dto.salesDayId,
        contributions,
        displays
      });

      return Result.ok(loadSheet.toPrimitives());
    } catch (error) {
      return Result.fail(error as Error);
    }
  }
}
