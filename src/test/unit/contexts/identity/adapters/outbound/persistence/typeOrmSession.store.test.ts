import test from 'node:test';
import assert from 'node:assert/strict';
import { DataSource } from 'typeorm';
import { TypeOrmSessionStore } from '@/contexts/identity/adapters/outbound/persistence/typeOrmSession.store';

const user = { id: 'u1', email: 'a@b.co', displayName: 'Ada' };

function store(open: number, found: { expiresAt: Date } | null): TypeOrmSessionStore {
  const sessions = Array.from({ length: open }, (_, index) => ({ token: `t${index}` }));
  const repo = {
    delete: async () => undefined,
    find: async () => sessions,
    findOne: async () => found,
    create: (value: unknown) => value,
    save: async () => undefined
  };
  const dataSource = {
    transaction: async (run: (manager: { getRepository: () => typeof repo }) => Promise<void>) => {
      await run({ getRepository: () => repo });
    },
    getRepository: () => repo
  } as unknown as DataSource;
  return new TypeOrmSessionStore(dataSource);
}

test('TypeOrmSessionStore issues a token, drops overflow, and expires a session', async () => {
  const issued = await store(3, null).issue(user);
  assert.equal(issued.user.id, 'u1');
  assert.equal(issued.token.length > 10, true);

  assert.equal(await store(0, null).find('missing'), null);
  assert.equal(await store(0, { expiresAt: new Date(Date.now() - 1000) }).find('old'), null);

  const current = await store(0, { expiresAt: new Date(Date.now() + 60_000), token: 'live', userId: 'u1', email: user.email, displayName: user.displayName } as never).find('live');
  assert.equal(current?.user.email, user.email);
  await store(0, null).revoke('live');
});
