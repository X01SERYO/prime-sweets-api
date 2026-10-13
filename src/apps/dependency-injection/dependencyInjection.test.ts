import test from 'node:test';
import assert from 'node:assert/strict';
import { buildContainer } from './index';

test('Dependency Injection Container - compiles and resolves all core services', async () => {
  const container = await buildContainer();

  // Persistence
  const dataSource = container.get('shared.infrastructure.persistence.typeorm.data_source');
  assert.ok(dataSource);

  // Catalog Repositories & Use Cases
  const brandRepo = container.get('catalog.domain.brand_repository');
  assert.ok(brandRepo);
  const productRepo = container.get('catalog.domain.product_repository');
  assert.ok(productRepo);

  const searchProductsUseCase = container.get('catalog.application.search_products_use_case');
  assert.ok(searchProductsUseCase);
  const createProductUseCase = container.get('catalog.application.create_product_use_case');
  assert.ok(createProductUseCase);
  const listProductsUseCase = container.get('catalog.application.list_products_use_case');
  assert.ok(listProductsUseCase);
  const getProductUseCase = container.get('catalog.application.get_product_use_case');
  assert.ok(getProductUseCase);
  const updateProductUseCase = container.get('catalog.application.update_product_use_case');
  assert.ok(updateProductUseCase);
  const deleteProductUseCase = container.get('catalog.application.delete_product_use_case');
  assert.ok(deleteProductUseCase);

  const createBrandUseCase = container.get('catalog.application.create_brand_use_case');
  assert.ok(createBrandUseCase);
  const listBrandsUseCase = container.get('catalog.application.list_brands_use_case');
  assert.ok(listBrandsUseCase);
  const getBrandUseCase = container.get('catalog.application.get_brand_use_case');
  assert.ok(getBrandUseCase);
  const updateBrandUseCase = container.get('catalog.application.update_brand_use_case');
  assert.ok(updateBrandUseCase);
  const deleteBrandUseCase = container.get('catalog.application.delete_brand_use_case');
  assert.ok(deleteBrandUseCase);

  // Customers Repository & Use Cases
  const customerRepo = container.get('customers.domain.customer_repository');
  assert.ok(customerRepo);

  const createCustomerUseCase = container.get('customers.application.create_customer_use_case');
  assert.ok(createCustomerUseCase);
  const getCustomerUseCase = container.get('customers.application.get_customer_use_case');
  assert.ok(getCustomerUseCase);
  const searchCustomersUseCase = container.get('customers.application.search_customers_use_case');
  assert.ok(searchCustomersUseCase);
  const updateCustomerUseCase = container.get('customers.application.update_customer_use_case');
  assert.ok(updateCustomerUseCase);

  // Sales Day Repository, Date Provider & Use Cases
  const salesDayRepo = container.get('sales_day.domain.sales_day_repository');
  assert.ok(salesDayRepo);
  const dateProvider = container.get('sales_day.application.date_provider');
  assert.ok(dateProvider);

  const openSalesDayUseCase = container.get('sales_day.application.open_current_sales_day_use_case');
  assert.ok(openSalesDayUseCase);
  const getCurrentSalesDayUseCase = container.get('sales_day.application.get_current_sales_day_use_case');
  assert.ok(getCurrentSalesDayUseCase);
  const closeSalesDayUseCase = container.get('sales_day.application.close_sales_day_use_case');
  assert.ok(closeSalesDayUseCase);
  const reopenSalesDayUseCase = container.get('sales_day.application.reopen_current_sales_day_use_case');
  assert.ok(reopenSalesDayUseCase);

  // Sales Repositories, Adapters & Use Cases
  const saleRepo = container.get('sales.domain.sale_repository');
  assert.ok(saleRepo);
  const invoiceAllocator = container.get('sales.domain.invoice_number_allocator');
  assert.ok(invoiceAllocator);
  const createSaleUseCase = container.get('sales.application.create_sale_use_case');
  assert.ok(createSaleUseCase);
  const addSaleItemUseCase = container.get('sales.application.add_sale_item_use_case');
  assert.ok(addSaleItemUseCase);
  const updateSaleItemQuantityUseCase = container.get('sales.application.update_sale_item_quantity_use_case');
  assert.ok(updateSaleItemQuantityUseCase);
  const updateSaleItemNameUseCase = container.get('sales.application.update_sale_item_name_use_case');
  assert.ok(updateSaleItemNameUseCase);
  const removeSaleItemUseCase = container.get('sales.application.remove_sale_item_use_case');
  assert.ok(removeSaleItemUseCase);
  const confirmSaleUseCase = container.get('sales.application.confirm_sale_use_case');
  assert.ok(confirmSaleUseCase);
  const voidSaleUseCase = container.get('sales.application.void_sale_use_case');
  assert.ok(voidSaleUseCase);
  const getSaleUseCase = container.get('sales.application.get_sale_use_case');
  assert.ok(getSaleUseCase);
  const listSalesUseCase = container.get('sales.application.list_sales_use_case');
  assert.ok(listSalesUseCase);

  // Alegra
  const alegraClient = container.get('alegra.infrastructure.http_client');
  assert.ok(alegraClient);
  const syncProductItemUseCase = container.get('alegra.application.sync_product_item_use_case');
  assert.ok(syncProductItemUseCase);
  const productAlegraSyncService = container.get('alegra.infrastructure.product_alegra_sync_service');
  assert.ok(productAlegraSyncService);
});
