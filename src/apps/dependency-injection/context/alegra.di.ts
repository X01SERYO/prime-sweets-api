import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { getAppConfig } from '../../../shared/infrastructure/config/appConfig';
import { AlegraHttpClient } from '../../../contexts/alegra/infrastructure/http/alegraHttpClient';
import { SyncProductItemUseCase } from '../../../contexts/alegra/application/syncProductItem/syncProductItem.useCase';
import { InProcessProductAlegraSyncService } from '../../../contexts/alegra/infrastructure/sync/inProcessProductAlegraSync.service';

export function registerAlegraDependencies(container: ContainerBuilder): void {
  const config = getAppConfig();

  container
    .register('alegra.infrastructure.http_client', AlegraHttpClient)
    .addArgument(config.alegra.baseUrl)
    .addArgument(config.alegra.token);

  const httpClientRef = new Reference('alegra.infrastructure.http_client');

  container
    .register('alegra.application.sync_product_item_use_case', SyncProductItemUseCase)
    .addArgument(httpClientRef)
    .addArgument(config.alegra.wholesalePriceListId)
    .addArgument(config.alegra.retailPriceListId);

  const syncUseCaseRef = new Reference('alegra.application.sync_product_item_use_case');

  container
    .register('alegra.infrastructure.product_alegra_sync_service', InProcessProductAlegraSyncService)
    .addArgument(syncUseCaseRef);
}
