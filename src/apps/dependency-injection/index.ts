import { ContainerBuilder } from 'node-dependency-injection';
import { registerPersistenceDependencies } from './context/persistence.di';
import { registerCatalogDependencies } from './context/catalog.di';
import { registerCustomerDependencies } from './context/customer.di';
import { registerSalesDayDependencies } from './context/salesDay.di';
import { registerSalesDependencies } from './context/sales.di';
import { registerFulfillmentOutputDependencies } from './context/fulfillmentOutput.di';
import { registerAlegraDependencies } from './context/alegra.di';

export async function buildContainer(): Promise<ContainerBuilder> {
  const container = new ContainerBuilder();

  container.setParameter('config.port', process.env.PORT ?? '3000');

  registerPersistenceDependencies(container);
  registerCatalogDependencies(container);
  registerCustomerDependencies(container);
  registerSalesDayDependencies(container);
  registerSalesDependencies(container);
  registerFulfillmentOutputDependencies(container);
  registerAlegraDependencies(container);

  await container.compile();

  return container;
}
