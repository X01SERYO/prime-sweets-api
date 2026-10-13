import { ProductAlegraSyncService } from '../../../catalog/application/ports/outbound/productAlegraSync.service';
import { SyncProductItemUseCase } from '../../application/syncProductItem/syncProductItem.useCase';

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
