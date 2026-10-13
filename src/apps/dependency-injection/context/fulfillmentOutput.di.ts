import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { CatalogProductDisplayAdapter } from '../../../contexts/fulfillment-output/adapters/outbound/catalogProductDisplay.adapter';
import { ConfirmedSaleItemsAdapter } from '../../../contexts/fulfillment-output/adapters/outbound/confirmedSaleItems.adapter';
import { InvoiceQueryAdapter } from '../../../contexts/fulfillment-output/adapters/outbound/invoiceQuery.adapter';
import { SalesDayClosureAdapter } from '../../../contexts/fulfillment-output/adapters/outbound/salesDayClosure.adapter';
import { GenerateLoadSheetUseCase } from '../../../contexts/fulfillment-output/application/use-cases/generateLoadSheet/generateLoadSheet.useCase';
import { ListInvoicesUseCase } from '../../../contexts/fulfillment-output/application/use-cases/listInvoices/listInvoices.useCase';

export function registerFulfillmentOutputDependencies(container: ContainerBuilder): void {
  const salesDayRepoRef = new Reference('sales_day.domain.sales_day_repository');
  const saleRepoRef = new Reference('sales.domain.sale_repository');
  const productRepoRef = new Reference('catalog.domain.product_repository');
  const brandRepoRef = new Reference('catalog.domain.brand_repository');

  container
    .register('fulfillment.infrastructure.sales_day_closure_query', SalesDayClosureAdapter)
    .addArgument(salesDayRepoRef);

  container
    .register('fulfillment.infrastructure.confirmed_sale_items_query', ConfirmedSaleItemsAdapter)
    .addArgument(saleRepoRef);

  container
    .register('fulfillment.infrastructure.catalog_product_display_query', CatalogProductDisplayAdapter)
    .addArgument(productRepoRef)
    .addArgument(brandRepoRef);

  container.register('fulfillment.infrastructure.invoice_query', InvoiceQueryAdapter).addArgument(saleRepoRef);

  container
    .register('fulfillment.application.generate_load_sheet_use_case', GenerateLoadSheetUseCase)
    .addArgument(new Reference('fulfillment.infrastructure.sales_day_closure_query'))
    .addArgument(new Reference('fulfillment.infrastructure.confirmed_sale_items_query'))
    .addArgument(new Reference('fulfillment.infrastructure.catalog_product_display_query'));

  container
    .register('fulfillment.application.list_invoices_use_case', ListInvoicesUseCase)
    .addArgument(new Reference('fulfillment.infrastructure.sales_day_closure_query'))
    .addArgument(new Reference('fulfillment.infrastructure.invoice_query'));
}
