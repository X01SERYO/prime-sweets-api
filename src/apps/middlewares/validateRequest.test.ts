import test from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';
import { validateRequest } from './validateRequest';

function createMockResponse() {
  const res: any = {
    statusCode: 200,
    body: null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: any) {
      this.body = data;
      return this;
    }
  };
  return res;
}

test('validateRequest middleware - allows valid payload and calls next()', () => {
  const schema = {
    body: z.object({
      name: z.string().min(1)
    })
  };

  const req: any = { body: { name: 'Super Duper' } };
  const res = createMockResponse();
  let nextCalled = false;

  validateRequest(schema)(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, 200);
});

test('validateRequest middleware - returns 400 with details when schema validation fails', () => {
  const schema = {
    body: z.object({
      name: z.string().min(1, 'Name is required')
    })
  };

  const req: any = { body: { name: '' } };
  const res = createMockResponse();
  let nextCalled = false;

  validateRequest(schema)(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
  assert.equal(res.body.code, 'INVALID_REQUEST_PAYLOAD');
  assert.equal(res.body.details[0].field, 'name');
  assert.equal(res.body.details[0].message, 'Name is required');
});
