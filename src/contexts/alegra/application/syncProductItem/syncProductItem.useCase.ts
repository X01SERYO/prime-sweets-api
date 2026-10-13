import { AlegraClient, AlegraPriceListItem } from '../../domain/interfaces/alegraClient.interface';

export class SyncProductItemUseCase {
  constructor(
    private readonly alegraClient: AlegraClient,
    private readonly majorPriceListId: string,
    private readonly minorPriceListId: string
  ) {}

  async run(input: {
    alegraId: string;
    name: string | null;
    wholesalePrice: number | null;
    retailPrice: number | null;
  }): Promise<void> {
    const prices: AlegraPriceListItem[] = [];

    if (input.wholesalePrice !== null && input.wholesalePrice !== undefined) {
      prices.push({ idPriceList: this.majorPriceListId, price: input.wholesalePrice });
    }

    if (input.retailPrice !== null && input.retailPrice !== undefined && input.retailPrice > 0) {
      prices.push({ idPriceList: this.minorPriceListId, price: input.retailPrice });
    }

    await this.alegraClient.updateItem(input.alegraId, {
      name: input.name ?? undefined,
      prices
    });
  }
}
