import test from 'node:test';
import assert from 'node:assert/strict';
import { InMemorySessionStore } from '../../../../../../contexts/identity/adapters/outbound/inMemorySession.store';

const user = { id: 'user-1', email: 'user@example.com', displayName: 'Usuario' };

test('InMemorySessionStore keeps at most three open sessions and drops the oldest', async () => {
  const store = new InMemorySessionStore();
  const first = await store.issue(user);
  const second = await store.issue(user);
  const third = await store.issue(user);
  const fourth = await store.issue(user);

  assert.equal(await store.find(first.token), null);
  assert.ok(await store.find(second.token));
  assert.ok(await store.find(third.token));
  assert.ok(await store.find(fourth.token));
});
