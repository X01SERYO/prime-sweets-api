import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { TypeOrmRetailDayRepository } from '@/contexts/retail-sales/adapters/outbound/persistence/repositories/typeOrmRetailDay.repository';
import { CatalogRetailProductSnapshotProvider } from '@/apps/dependency-injection/acl/catalogRetailProductSnapshotProvider';
import { GetTodayRetailDayUseCase } from '@/contexts/retail-sales/application/use-cases/getTodayRetailDay/getTodayRetailDay.useCase';
import { AddRetailItemUseCase } from '@/contexts/retail-sales/application/use-cases/addRetailItem/addRetailItem.useCase';
import { SetRetailItemQuantityUseCase } from '@/contexts/retail-sales/application/use-cases/setRetailItemQuantity/setRetailItemQuantity.useCase';
import { RemoveRetailItemUseCase } from '@/contexts/retail-sales/application/use-cases/removeRetailItem/removeRetailItem.useCase';

export function registerRetailSalesDependencies(container: ContainerBuilder): void {
  const dataSourceRef = new Reference('shared.infrastructure.persistence.typeorm.data_source');
  const productRepoRef = new Reference('catalog.domain.product_repository');
  const calendarRef = new Reference('sales.infrastructure.business_calendar_adapter');
  const idsRef = new Reference('shared.application.id_generator');

  container
    .register('retail.domain.retail_day_repository', TypeOrmRetailDayRepository)
    .addArgument(dataSourceRef);

  container
    .register('retail.infrastructure.product_snapshot_provider', CatalogRetailProductSnapshotProvider)
    .addArgument(productRepoRef);

  const retailDaysRef = new Reference('retail.domain.retail_day_repository');
  const snapshotRef = new Reference('retail.infrastructure.product_snapshot_provider');

  container
    .register('retail.application.get_today_retail_day_use_case', GetTodayRetailDayUseCase)
    .addArgument(retailDaysRef)
    .addArgument(calendarRef);

  container
    .register('retail.application.add_retail_item_use_case', AddRetailItemUseCase)
    .addArgument(retailDaysRef)
    .addArgument(snapshotRef)
    .addArgument(calendarRef)
    .addArgument(idsRef);

  container
    .register('retail.application.set_retail_item_quantity_use_case', SetRetailItemQuantityUseCase)
    .addArgument(retailDaysRef)
    .addArgument(calendarRef);

  container
    .register('retail.application.remove_retail_item_use_case', RemoveRetailItemUseCase)
    .addArgument(retailDaysRef)
    .addArgument(calendarRef);
}
