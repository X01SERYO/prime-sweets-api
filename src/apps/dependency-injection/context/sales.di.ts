import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { TypeOrmSaleRepository } from '../../../contexts/sales/adapters/outbound/persistence/repositories/typeOrmSale.repository';
import { TypeOrmInvoiceNumberAllocator } from '../../../contexts/sales/adapters/outbound/persistence/repositories/typeOrmInvoiceNumberAllocator';
import { BusinessCalendarAdapter } from '../acl/businessCalendar.adapter';
import { CustomerCheckerAdapter } from '../acl/customerChecker.adapter';
import { CatalogProductSnapshotAdapter } from '../acl/catalogProductSnapshot.adapter';
import { CreateSaleUseCase } from '../../../contexts/sales/application/use-cases/createSale/createSale.useCase';
import { AddSaleItemUseCase } from '../../../contexts/sales/application/use-cases/addSaleItem/addSaleItem.useCase';
import { UpdateSaleItemQuantityUseCase } from '../../../contexts/sales/application/use-cases/updateSaleItemQuantity/updateSaleItemQuantity.useCase';
import { UpdateSaleItemNameUseCase } from '../../../contexts/sales/application/use-cases/updateSaleItemName/updateSaleItemName.useCase';
import { RemoveSaleItemUseCase } from '../../../contexts/sales/application/use-cases/removeSaleItem/removeSaleItem.useCase';
import { ConfirmSaleUseCase } from '../../../contexts/sales/application/use-cases/confirmSale/confirmSale.useCase';
import { SetSaleDeliveryDateUseCase } from '../../../contexts/sales/application/use-cases/setSaleDeliveryDate/setSaleDeliveryDate.useCase';
import { VoidSaleUseCase } from '../../../contexts/sales/application/use-cases/voidSale/voidSale.useCase';
import { GetSaleUseCase } from '../../../contexts/sales/application/use-cases/getSale/getSale.useCase';
import { ListSalesUseCase } from '../../../contexts/sales/application/use-cases/listSales/listSales.useCase';

export function registerSalesDependencies(container: ContainerBuilder): void {
  const dataSourceRef = new Reference('shared.infrastructure.persistence.typeorm.data_source');
  const customerRepoRef = new Reference('customers.domain.customer_repository');
  const productRepoRef = new Reference('catalog.domain.product_repository');

  container
    .register('sales.domain.sale_repository', TypeOrmSaleRepository)
    .addArgument(dataSourceRef);

  container
    .register('sales.domain.invoice_number_allocator', TypeOrmInvoiceNumberAllocator)
    .addArgument(dataSourceRef);

  container
    .register('sales.infrastructure.business_calendar_adapter', BusinessCalendarAdapter)
    .addArgument(new Reference('sales_day.application.date_provider'));

  container
    .register('sales.infrastructure.customer_checker_adapter', CustomerCheckerAdapter)
    .addArgument(customerRepoRef);

  container
    .register('sales.infrastructure.catalog_product_snapshot_adapter', CatalogProductSnapshotAdapter)
    .addArgument(productRepoRef);

  const saleRepoRef = new Reference('sales.domain.sale_repository');
  const invoiceAllocatorRef = new Reference('sales.domain.invoice_number_allocator');
  const calendarRef = new Reference('sales.infrastructure.business_calendar_adapter');
  const customerCheckerRef = new Reference('sales.infrastructure.customer_checker_adapter');
  const productSnapshotRef = new Reference('sales.infrastructure.catalog_product_snapshot_adapter');
  const idsRef = new Reference('shared.application.id_generator');

  container
    .register('sales.application.create_sale_use_case', CreateSaleUseCase)
    .addArgument(saleRepoRef)
    .addArgument(customerCheckerRef)
    .addArgument(productSnapshotRef)
    .addArgument(calendarRef)
    .addArgument(idsRef);

  container
    .register('sales.application.add_sale_item_use_case', AddSaleItemUseCase)
    .addArgument(saleRepoRef)
    .addArgument(productSnapshotRef)
    .addArgument(idsRef);

  container
    .register('sales.application.update_sale_item_quantity_use_case', UpdateSaleItemQuantityUseCase)
    .addArgument(saleRepoRef);

  container
    .register('sales.application.update_sale_item_name_use_case', UpdateSaleItemNameUseCase)
    .addArgument(saleRepoRef);

  container
    .register('sales.application.remove_sale_item_use_case', RemoveSaleItemUseCase)
    .addArgument(saleRepoRef);

  container
    .register('sales.application.set_sale_delivery_date_use_case', SetSaleDeliveryDateUseCase)
    .addArgument(saleRepoRef)
    .addArgument(calendarRef);

  container
    .register('sales.application.confirm_sale_use_case', ConfirmSaleUseCase)
    .addArgument(saleRepoRef)
    .addArgument(calendarRef)
    .addArgument(invoiceAllocatorRef);

  container
    .register('sales.application.void_sale_use_case', VoidSaleUseCase)
    .addArgument(saleRepoRef);

  container
    .register('sales.application.get_sale_use_case', GetSaleUseCase)
    .addArgument(saleRepoRef);

  container
    .register('sales.application.list_sales_use_case', ListSalesUseCase)
    .addArgument(saleRepoRef);
}
