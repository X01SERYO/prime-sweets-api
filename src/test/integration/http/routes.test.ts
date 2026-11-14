import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import express from 'express';
import { AddressInfo } from 'node:net';
import { AppContainer } from '@/apps/dependency-injection/appContainer';
import { Result } from '@/shared/application/result/result';
import { createAuthRouter } from '@/contexts/identity/adapters/inbound/http/auth.route';
import { createBrandsRouter } from '@/contexts/catalog/adapters/inbound/http/brands.route';
import { createProductsRouter } from '@/contexts/catalog/adapters/inbound/http/products.route';
import { createCustomersRouter } from '@/contexts/customers/adapters/inbound/http/customers.route';
import { createSalesRouter } from '@/contexts/sales/adapters/inbound/http/sales.route';
import { createLoadSheetsRouter } from '@/contexts/fulfillment-output/adapters/inbound/http/loadSheet.route';
import { createInvoicesRouter } from '@/contexts/fulfillment-output/adapters/inbound/http/invoices.route';

function container(): AppContainer {
  return {
    get: () => ({ run: async () => Result.ok({ id: '1' }) })
  } as unknown as AppContainer;
}

async function start() {
  const app = express();
  app.use(express.json());
  app.use((_req, res, next) => {
    res.locals.session = { user: { id: 'seller-1' } };
    next();
  });
  const c = container();
  app.use('/auth', createAuthRouter(c));
  app.use('/brands', createBrandsRouter(c));
  app.use('/products', createProductsRouter(c));
  app.use('/customers', createCustomersRouter(c));
  app.use('/sales', createSalesRouter(c));
  app.use('/load-sheets', createLoadSheetsRouter(c));
  app.use('/invoices', createInvoicesRouter(c));
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  return { server, port: (server.address() as AddressInfo).port };
}

function call(
  port: number,
  method: string,
  path: string,
  body?: unknown
): Promise<{ status: number; json: { success?: boolean } }> {
  return new Promise((resolve, reject) => {
    const payload = body === undefined ? undefined : JSON.stringify(body);
    const req = http.request(
      {
        port,
        method,
        path,
        headers: {
          'content-type': 'application/json',
          authorization: 'Bearer token',
          ...(payload ? { 'content-length': Buffer.byteLength(payload) } : {})
        }
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString();
          resolve({ status: res.statusCode ?? 0, json: text ? JSON.parse(text) : {} });
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

test('HTTP routers accept a valid call on every route and reject an empty body', async () => {
  const { server, port } = await start();
  try {
    const ok: Array<[string, string, unknown?]> = [
      ['POST', '/auth/login', { email: 'a@b.co', password: 'secret' }],
      ['GET', '/auth/session'],
      ['POST', '/auth/logout'],
      ['GET', '/brands'],
      ['GET', '/brands/b1'],
      ['POST', '/brands', { name: 'Acme', code: 'ACM' }],
      ['PUT', '/brands/b1', { name: 'Acme' }],
      ['DELETE', '/brands/b1'],
      ['GET', '/products'],
      ['GET', '/products?page=1&pageSize=10'],
      ['GET', '/products?q=soda'],
      ['GET', '/products/search?search=soda'],
      ['GET', '/products/p1'],
      ['POST', '/products', { name: 'Soda', wholesalePrice: 1, retailPrice: 2 }],
      ['PUT', '/products/p1', { name: 'Soda', wholesalePrice: 0, retailPrice: 1, units: 1, pack: 1 }],
      ['DELETE', '/products/p1'],
      ['GET', '/customers'],
      ['GET', '/customers/search?q=tienda'],
      ['GET', '/customers/c1'],
      ['POST', '/customers', { documentType: 'CC', documentNumber: '1', name: 'Ana' }],
      ['PUT', '/customers/c1', { name: 'Ana' }],
      ['POST', '/sales', { customerId: 'c1', deliveryDate: '2026-11-14', items: [{ productId: 'p1', quantity: 1.5 }] }],
      ['GET', '/sales?deliveryDate=2026-11-14&status=DRAFT'],
      ['GET', '/sales/s1'],
      ['POST', '/sales/s1/items', { productId: 'p1', quantity: 2 }],
      ['PUT', '/sales/s1/items/i1/quantity', { quantity: 3 }],
      ['PUT', '/sales/s1/items/i1/name', { itemName: 'Soda' }],
      ['DELETE', '/sales/s1/items/i1'],
      ['PATCH', '/sales/s1/delivery-date', { deliveryDate: '2026-11-15' }],
      ['POST', '/sales/s1/confirm'],
      ['POST', '/sales/s1/void'],
      ['GET', '/load-sheets?deliveryDate=2026-11-14'],
      ['GET', '/invoices?deliveryDate=2026-11-14'],
      ['GET', '/invoices/s1']
    ];

    for (const [method, path, body] of ok) {
      const response = await call(port, method, path, body);
      assert.equal(response.status === 200 || response.status === 201, true, `${method} ${path} -> ${response.status}`);
      assert.equal(response.json.success, true);
    }

    const rejected = await call(port, 'POST', '/sales', {});
    assert.equal(rejected.status, 400);
    assert.equal(rejected.json.success, false);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
