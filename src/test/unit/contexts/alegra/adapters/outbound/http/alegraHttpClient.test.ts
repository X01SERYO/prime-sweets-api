import test from 'node:test';
import assert from 'node:assert/strict';
import { AlegraHttpClient } from '@/contexts/alegra/adapters/outbound/http/alegraHttpClient';
import { AlegraRequestError } from '@/contexts/alegra/domain/errors/alegraRequest.error';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status });
}

test('AlegraHttpClient updates only the fields sent and returns the confirmed item', async () => {
  const calls: Array<{ url: string; method: string; body: string }> = [];
  const original = global.fetch;
  global.fetch = (async (url: string | URL, init?: RequestInit) => {
    calls.push({ url: String(url), method: init?.method ?? '', body: String(init?.body ?? '') });
    return jsonResponse(200, { id: 9 });
  }) as typeof fetch;

  try {
    const client = new AlegraHttpClient('https://alegra.test/api/v1', 'token');
    const updated = await client.updateItem('9', { name: 'SODA', prices: [{ idPriceList: '1', price: 0 }] });
    assert.equal((updated as { id: number }).id, 9);
    assert.equal(calls[0].method, 'PUT');
    assert.equal(JSON.parse(calls[0].body).name, 'SODA');

    const created = await client.createItem({ name: 'SODA', prices: [] });
    assert.equal(created, '9');
    assert.equal(calls[1].method, 'POST');
  } finally {
    global.fetch = original;
  }
});

test('AlegraHttpClient rejects a non-json body and an unconfirmed response', async () => {
  const original = global.fetch;
  global.fetch = (async () => new Response('nope', { status: 500 })) as typeof fetch;
  try {
    const client = new AlegraHttpClient('https://alegra.test/api/v1', 'token');
    await assert.rejects(() => client.updateItem('9', {}), AlegraRequestError);
    await assert.rejects(() => client.createItem({ name: 'SODA', prices: [] }), AlegraRequestError);
  } finally {
    global.fetch = original;
  }
});
