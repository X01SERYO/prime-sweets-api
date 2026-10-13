import { Application } from 'express';
import { createBrandsRouter } from '../../../contexts/catalog/adapters/inbound/http/brands.route';
import { createProductsRouter } from '../../../contexts/catalog/adapters/inbound/http/products.route';
import { createCustomersRouter } from '../../../contexts/customers/adapters/inbound/http/customers.route';
import { createSalesDaysRouter } from '../../../contexts/sales-day/adapters/inbound/http/salesDay.route';
import { createSalesRouter } from '../../../contexts/sales/adapters/inbound/http/sales.route';

export function registerRoutes(app: Application, container: any) {
  app.use('/brands', createBrandsRouter(container));
  app.use('/products', createProductsRouter(container));
  app.use('/customers', createCustomersRouter(container));
  app.use('/sales-days', createSalesDaysRouter(container));
  app.use('/sales', createSalesRouter(container));
}

