import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { AlegraHttpClient } from '../../../contexts/alegra/infrastructure/http/alegraHttpClient';
import { SyncProductItemUseCase } from '../../../contexts/alegra/application/syncProductItem/syncProductItem.useCase';
import { InProcessProductAlegraSyncService } from '../../../contexts/alegra/infrastructure/sync/inProcessProductAlegraSync.service';

export function registerAlegraDependencies(container: ContainerBuilder): void {
  container
    .register('alegra.infrastructure.http_client', AlegraHttpClient)
    .addArgument(process.env.ALEGRA_BASE_URL ?? '')
    .addArgument(process.env.ALEGRA_TOKEN ?? '');

  const httpClientRef = new Reference('alegra.infrastructure.http_client');

  container
    .register('alegra.application.sync_product_item_use_case', SyncProductItemUseCase)
    .addArgument(httpClientRef)
    .addArgument(process.env.ALEGRA_PRICE_LIST_MAJOR_ID ?? '')
    .addArgument(process.env.ALEGRA_PRICE_LIST_MINOR_ID ?? '');

  const syncUseCaseRef = new Reference('alegra.application.sync_product_item_use_case');

  container
    .register('alegra.infrastructure.product_alegra_sync_service', InProcessProductAlegraSyncService)
    .addArgument(syncUseCaseRef);
}
