import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { getAppConfig } from '../../../shared/infrastructure/config/appConfig';
import { TypeOrmSalesDayRepository } from '../../../contexts/sales-day/adapters/outbound/persistence/repositories/typeOrmSalesDay.repository';
import { ColombianBusinessDateProvider } from '../../../contexts/sales-day/application/services/businessDate.provider';
import { OpenCurrentSalesDayUseCase } from '../../../contexts/sales-day/application/use-cases/openCurrentSalesDay/openCurrentSalesDay.useCase';
import { GetCurrentSalesDayUseCase } from '../../../contexts/sales-day/application/use-cases/getCurrentSalesDay/getCurrentSalesDay.useCase';
import { CloseSalesDayUseCase } from '../../../contexts/sales-day/application/use-cases/closeSalesDay/closeSalesDay.useCase';
import { ReopenCurrentSalesDayUseCase } from '../../../contexts/sales-day/application/use-cases/reopenCurrentSalesDay/reopenCurrentSalesDay.useCase';

export function registerSalesDayDependencies(container: ContainerBuilder): void {
  const dataSourceRef = new Reference('shared.infrastructure.persistence.typeorm.data_source');

  container.register('sales_day.domain.sales_day_repository', TypeOrmSalesDayRepository).addArgument(dataSourceRef);

  container
    .register('sales_day.application.date_provider', ColombianBusinessDateProvider)
    .addArgument(getAppConfig().businessTimeZone);

  const salesDayRepoRef = new Reference('sales_day.domain.sales_day_repository');
  const dateProviderRef = new Reference('sales_day.application.date_provider');
  const idsRef = new Reference('shared.application.id_generator');

  container
    .register('sales_day.application.open_current_sales_day_use_case', OpenCurrentSalesDayUseCase)
    .addArgument(salesDayRepoRef)
    .addArgument(dateProviderRef)
    .addArgument(idsRef);

  container
    .register('sales_day.application.get_current_sales_day_use_case', GetCurrentSalesDayUseCase)
    .addArgument(salesDayRepoRef)
    .addArgument(dateProviderRef);

  container
    .register('sales_day.application.close_sales_day_use_case', CloseSalesDayUseCase)
    .addArgument(salesDayRepoRef);

  container
    .register('sales_day.application.reopen_current_sales_day_use_case', ReopenCurrentSalesDayUseCase)
    .addArgument(salesDayRepoRef)
    .addArgument(dateProviderRef);
}
