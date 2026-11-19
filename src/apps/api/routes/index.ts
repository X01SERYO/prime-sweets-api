import { Application } from 'express';
import { AppContainer } from '@/apps/dependency-injection/appContainer';
import { createBrandsRouter } from '@/contexts/catalog/adapters/inbound/http/brands.route';
import { createProductsRouter } from '@/contexts/catalog/adapters/inbound/http/products.route';
import { createCustomersRouter } from '@/contexts/customers/adapters/inbound/http/customers.route';
import { createSalesRouter } from '@/contexts/sales/adapters/inbound/http/sales.route';
import { createLoadSheetsRouter } from '@/contexts/fulfillment-output/adapters/inbound/http/loadSheet.route';
import { createInvoicesRouter } from '@/contexts/fulfillment-output/adapters/inbound/http/invoices.route';
import { createAuthRouter } from '@/contexts/identity/adapters/inbound/http/auth.route';
import { createRetailDaysRouter } from '@/contexts/retail-sales/adapters/inbound/http/retailDays.route';
import { createPurchaseOrdersRouter } from '@/contexts/purchasing/adapters/inbound/http/purchaseOrders.route';
import { createSuppliersRouter } from '@/contexts/purchasing/adapters/inbound/http/suppliers.route';
import { requireSession } from '@/apps/middlewares/requireSession';

export function registerRoutes(app: Application, container: AppContainer) {
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  const session = requireSession(container);
  app.use('/auth', createAuthRouter(container));
  app.use('/brands', session, createBrandsRouter(container));
  app.use('/products', session, createProductsRouter(container));
  app.use('/customers', session, createCustomersRouter(container));
  app.use('/sales', session, createSalesRouter(container));
  app.use('/retail-days', session, createRetailDaysRouter(container));
  app.use('/suppliers', session, createSuppliersRouter(container));
  app.use('/purchase-orders', session, createPurchaseOrdersRouter(container));
  app.use('/load-sheets', session, createLoadSheetsRouter(container));
  app.use('/invoices', session, createInvoicesRouter(container));
}
