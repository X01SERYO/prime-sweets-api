import { Result } from '@shared/application/result/result';
import { LoadSheet, LoadSheetPrimitives } from '@fulfillment-output/domain/entities/loadSheet';
import { InvalidLoadSheetDeliveryDateError } from '@fulfillment-output/domain/errors/invalidLoadSheetDeliveryDate.error';
import { GenerateLoadSheetDto } from '@fulfillment-output/application/dto/generateLoadSheet.dto';
import { CatalogProductDisplayQuery } from '@fulfillment-output/application/ports/outbound/catalogProductDisplayQuery.port';
import { ConfirmedSaleItemsQuery } from '@fulfillment-output/application/ports/outbound/confirmedSaleItemsQuery.port';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export class GenerateLoadSheetUseCase {
  constructor(
    private readonly confirmedSaleItemsQuery: ConfirmedSaleItemsQuery,
    private readonly catalogProductDisplayQuery: CatalogProductDisplayQuery
  ) {}

  async run(dto: GenerateLoadSheetDto): Promise<Result<LoadSheetPrimitives>> {
    const deliveryDate = dto.deliveryDate?.trim() ?? '';
    if (!DATE_REGEX.test(deliveryDate)) {
      return Result.fail(new InvalidLoadSheetDeliveryDateError());
    }

    const contributions = await this.confirmedSaleItemsQuery.findConfirmedByDeliveryDate(deliveryDate);
    const productIds = [...new Set(contributions.map(contribution => contribution.productId))];
    const displays = await this.catalogProductDisplayQuery.findByProductIds(productIds);

    try {
      const loadSheet = LoadSheet.compose({
        deliveryDate,
        contributions,
        displays
      });

      return Result.ok(loadSheet.toPrimitives());
    } catch (error) {
      return Result.fail(error as Error);
    }
  }
}
