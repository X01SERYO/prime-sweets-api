import { SyncProductItemUseCase } from '../../../contexts/alegra/application/syncProductItem/syncProductItem.useCase';
import { ProductAlegraSyncService } from '../../../contexts/catalog/application/ports/outbound/productAlegraSync.service';

export class InProcessProductAlegraSyncService implements ProductAlegraSyncService {
  constructor(private readonly syncProductItemUseCase: SyncProductItemUseCase) {}

  async sync(input: {
    alegraId: string;
    name: string | null;
    wholesalePrice: number | null;
    retailPrice: number | null;
  }): Promise<void> {
    await this.syncProductItemUseCase.run(input);
  }
}
