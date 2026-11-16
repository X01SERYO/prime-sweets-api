import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { TypeOrmRetailDayRepository } from '@/contexts/retail-sales/adapters/outbound/persistence/repositories/typeOrmRetailDay.repository';
import { CatalogRetailProductSnapshotProvider } from '@/apps/dependency-injection/acl/catalogRetailProductSnapshotProvider';
import { GetRetailDayUseCase } from '@/contexts/retail-sales/application/use-cases/getRetailDay/getRetailDay.useCase';
import { GetTodayRetailDayUseCase } from '@/contexts/retail-sales/application/use-cases/getTodayRetailDay/getTodayRetailDay.useCase';
import { AddRetailItemUseCase } from '@/contexts/retail-sales/application/use-cases/addRetailItem/addRetailItem.useCase';
import { SetRetailItemQuantityUseCase } from '@/contexts/retail-sales/application/use-cases/setRetailItemQuantity/setRetailItemQuantity.useCase';
import { RemoveRetailItemUseCase } from '@/contexts/retail-sales/application/use-cases/removeRetailItem/removeRetailItem.useCase';
import { ListRetailDaysUseCase } from '@/contexts/retail-sales/application/use-cases/listRetailDays/listRetailDays.useCase';
import { ReviewRetailDaysUseCase } from '@/contexts/retail-sales/application/use-cases/reviewRetailDays/reviewRetailDays.useCase';
import { UserDisplayNameQuery } from '@/apps/dependency-injection/acl/userDisplayName.query';

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

  container
    .register('retail.infrastructure.reviewer_query', UserDisplayNameQuery)
    .addArgument(dataSourceRef);

  const retailDaysRef = new Reference('retail.domain.retail_day_repository');
  const snapshotRef = new Reference('retail.infrastructure.product_snapshot_provider');

  const reviewerRef = new Reference('retail.infrastructure.reviewer_query');

  container
    .register('retail.application.get_today_retail_day_use_case', GetTodayRetailDayUseCase)
    .addArgument(retailDaysRef)
    .addArgument(reviewerRef)
    .addArgument(calendarRef);

  container
    .register('retail.application.get_retail_day_use_case', GetRetailDayUseCase)
    .addArgument(retailDaysRef)
    .addArgument(reviewerRef)
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

  container
    .register('retail.application.list_retail_days_use_case', ListRetailDaysUseCase)
    .addArgument(retailDaysRef)
    .addArgument(reviewerRef)
    .addArgument(calendarRef);

  container
    .register('retail.application.review_retail_days_use_case', ReviewRetailDaysUseCase)
    .addArgument(retailDaysRef)
    .addArgument(calendarRef);
}
