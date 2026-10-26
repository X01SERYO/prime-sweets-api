import { ContainerBuilder } from 'node-dependency-injection';
import { getAppConfig } from '../../shared/infrastructure/config/appConfig';
import { registerPersistenceDependencies } from './context/persistence.di';
import { registerCatalogDependencies } from './context/catalog.di';
import { registerCustomerDependencies } from './context/customer.di';
import { registerSalesDayDependencies } from './context/salesDay.di';
import { registerSalesDependencies } from './context/sales.di';
import { registerFulfillmentOutputDependencies } from './context/fulfillmentOutput.di';
import { registerAlegraDependencies } from './context/alegra.di';
import { registerIdentityDependencies } from './context/identity.di';

export async function buildContainer(): Promise<ContainerBuilder> {
  const container = new ContainerBuilder();
  const config = getAppConfig();

  container.setParameter('config.port', String(config.port));

  registerPersistenceDependencies(container);
  registerCatalogDependencies(container);
  registerCustomerDependencies(container);
  registerSalesDayDependencies(container);
  registerSalesDependencies(container);
  registerFulfillmentOutputDependencies(container);
  registerAlegraDependencies(container);
  registerIdentityDependencies(container);

  await container.compile();

  return container;
}
