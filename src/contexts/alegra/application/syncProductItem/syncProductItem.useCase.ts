import { AlegraClient, AlegraPriceListItem } from '../ports/outbound/alegraClient.port';

export class SyncProductItemUseCase {
  constructor(
    private readonly alegraClient: AlegraClient,
    private readonly majorPriceListId: string,
    private readonly minorPriceListId: string
  ) {}

  async run(input: {
    alegraId: string;
    name?: string | null;
    wholesalePrice?: number;
    retailPrice?: number;
  }): Promise<void> {
    const prices: AlegraPriceListItem[] = [];

    if (input.wholesalePrice !== undefined) {
      prices.push({ idPriceList: this.majorPriceListId, price: input.wholesalePrice });
    }

    if (input.retailPrice !== undefined) {
      prices.push({ idPriceList: this.minorPriceListId, price: input.retailPrice });
    }

    await this.alegraClient.updateItem(input.alegraId, {
      ...(input.name !== undefined && input.name !== null ? { name: input.name } : {}),
      prices
    });
  }
}
