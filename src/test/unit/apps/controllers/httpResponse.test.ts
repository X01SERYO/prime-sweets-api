import test from 'node:test';
import assert from 'node:assert/strict';
import { httpResponse } from '@/apps/controllers/httpResponse';
import { Result } from '@/shared/application/result/result';
import { SaleNotFoundError } from '@/contexts/sales/domain/errors/saleNotFound.error';
import { InvalidCredentialsError } from '@/contexts/identity/domain/errors/invalidCredentials.error';
import { InvalidSaleError } from '@/contexts/sales/domain/errors/invalidSale.error';

function response() {
  const state: { status?: number; body?: unknown } = {};
  return {
    state,
    res: {
      status(code: number) {
        state.status = code;
        return this;
      },
      json(body: unknown) {
        state.body = body;
        return this;
      }
    }
  };
}

test('httpResponse maps success, not found, unauthorized, domain, and unknown errors', () => {
  const ok = response();
  httpResponse(ok.res as never, Result.ok({ id: '1' }), 201);
  assert.equal(ok.state.status, 201);

  const missing = response();
  httpResponse(missing.res as never, Result.fail(new SaleNotFoundError('s-1')));
  assert.equal(missing.state.status, 404);

  const denied = response();
  httpResponse(denied.res as never, Result.fail(new InvalidCredentialsError()));
  assert.equal(denied.state.status, 401);

  const invalid = response();
  httpResponse(invalid.res as never, Result.fail(new InvalidSaleError('bad')));
  assert.equal(invalid.state.status, 400);

  const unknown = response();
  httpResponse(unknown.res as never, Result.fail(new Error('boom')));
  assert.equal(unknown.state.status, 500);
});
