import { AlegraClient } from '../ports/outbound/alegraClient.port';

export class CreateProductItemUseCase {
  constructor(
    private readonly alegraClient: AlegraClient,
    private readonly majorPriceListId: string,
    private readonly minorPriceListId: string
  ) {}

  async run(input: { name: string; wholesalePrice: number; retailPrice: number }): Promise<string> {
    return this.alegraClient.createItem({
      name: input.name,
      prices: [
        { idPriceList: this.majorPriceListId, price: input.wholesalePrice },
        { idPriceList: this.minorPriceListId, price: input.retailPrice }
      ]
    });
  }
}
