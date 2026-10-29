import { Application } from 'express';
import { createBrandsRouter } from '../../../contexts/catalog/adapters/inbound/http/brands.route';
import { createProductsRouter } from '../../../contexts/catalog/adapters/inbound/http/products.route';
import { createCustomersRouter } from '../../../contexts/customers/adapters/inbound/http/customers.route';
import { createSalesDaysRouter } from '../../../contexts/sales-day/adapters/inbound/http/salesDay.route';
import { createSalesRouter } from '../../../contexts/sales/adapters/inbound/http/sales.route';
import { createLoadSheetsRouter } from '../../../contexts/fulfillment-output/adapters/inbound/http/loadSheet.route';
import { createInvoicesRouter } from '../../../contexts/fulfillment-output/adapters/inbound/http/invoices.route';
import { createAuthRouter } from '../../../contexts/identity/adapters/inbound/http/auth.route';
import { requireSession } from '../../middlewares/requireSession';

export function registerRoutes(app: Application, container: any) {
  const session = requireSession(container);
  app.use('/auth', createAuthRouter(container));
  app.use('/brands', session, createBrandsRouter(container));
  app.use('/products', session, createProductsRouter(container));
  app.use('/customers', session, createCustomersRouter(container));
  app.use('/sales-days', session, createSalesDaysRouter(container));
  app.use('/sales', session, createSalesRouter(container));
  app.use('/load-sheets', session, createLoadSheetsRouter(container));
  app.use('/invoices', session, createInvoicesRouter(container));
}
