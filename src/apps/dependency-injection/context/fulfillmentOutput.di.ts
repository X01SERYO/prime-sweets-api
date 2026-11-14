import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { CatalogProductDisplayAdapter } from '@apps/dependency-injection/acl/catalogProductDisplay.adapter';
import { ConfirmedSaleItemsAdapter } from '@apps/dependency-injection/acl/confirmedSaleItems.adapter';
import { EnvCompanyProfileAdapter } from '@fulfillment-output/adapters/outbound/envCompanyProfile.adapter';
import { InvoiceCustomerAdapter } from '@apps/dependency-injection/acl/invoiceCustomer.adapter';
import { InvoiceQueryAdapter } from '@apps/dependency-injection/acl/invoiceQuery.adapter';
import { InvoiceSaleAdapter } from '@apps/dependency-injection/acl/invoiceSale.adapter';
import { GenerateInvoiceUseCase } from '@fulfillment-output/application/use-cases/generateInvoice/generateInvoice.useCase';
import { GenerateLoadSheetUseCase } from '@fulfillment-output/application/use-cases/generateLoadSheet/generateLoadSheet.useCase';
import { ListInvoicesUseCase } from '@fulfillment-output/application/use-cases/listInvoices/listInvoices.useCase';

export function registerFulfillmentOutputDependencies(container: ContainerBuilder): void {
  const saleRepoRef = new Reference('sales.domain.sale_repository');
  const productRepoRef = new Reference('catalog.domain.product_repository');
  const brandRepoRef = new Reference('catalog.domain.brand_repository');
  const customerRepoRef = new Reference('customers.domain.customer_repository');

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
    .addArgument(new Reference('fulfillment.infrastructure.confirmed_sale_items_query'))
    .addArgument(new Reference('fulfillment.infrastructure.catalog_product_display_query'));

  container
    .register('fulfillment.application.list_invoices_use_case', ListInvoicesUseCase)
    .addArgument(new Reference('fulfillment.infrastructure.invoice_query'));

  container.register('fulfillment.infrastructure.invoice_sale_query', InvoiceSaleAdapter).addArgument(saleRepoRef);

  container
    .register('fulfillment.infrastructure.invoice_customer_query', InvoiceCustomerAdapter)
    .addArgument(customerRepoRef);

  container.register('fulfillment.infrastructure.company_profile_query', EnvCompanyProfileAdapter);

  container
    .register('fulfillment.application.generate_invoice_use_case', GenerateInvoiceUseCase)
    .addArgument(new Reference('fulfillment.infrastructure.invoice_sale_query'))
    .addArgument(new Reference('fulfillment.infrastructure.invoice_customer_query'))
    .addArgument(new Reference('fulfillment.infrastructure.company_profile_query'));
}
