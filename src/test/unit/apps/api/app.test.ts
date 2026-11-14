import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { AddressInfo } from 'node:net';
import { createApp } from '@/apps/api/app';
import { AppContainer } from '@/apps/dependency-injection/appContainer';
import { Result } from '@/shared/application/result/result';

test('createApp answers CORS preflight and registers the routers', async () => {
  const container = {
    get: () => ({ run: async () => Result.ok({ user: { id: 'u1' } }) })
  } as unknown as AppContainer;
  const app = createApp(container);
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as AddressInfo).port;
  try {
    const status = await new Promise<number>((resolve, reject) => {
      const req = http.request({ port, method: 'OPTIONS', path: '/brands' }, (res) => {
        res.resume();
        res.on('end', () => resolve(res.statusCode ?? 0));
      });
      req.on('error', reject);
      req.end();
    });
    assert.equal(status, 204);

    const brands = await new Promise<number>((resolve, reject) => {
      const req = http.request(
        { port, method: 'GET', path: '/brands', headers: { authorization: 'Bearer token' } },
        (res) => {
          res.resume();
          res.on('end', () => resolve(res.statusCode ?? 0));
        }
      );
      req.on('error', reject);
      req.end();
    });
    assert.equal(brands, 200);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
