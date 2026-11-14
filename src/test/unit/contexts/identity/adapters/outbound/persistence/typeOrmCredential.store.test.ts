import test from 'node:test';
import assert from 'node:assert/strict';
import { DataSource } from 'typeorm';
import { TypeOrmCredentialStore } from '../../../../../../../contexts/identity/adapters/outbound/persistence/typeOrmCredential.store';

test('TypeOrmCredentialStore returns the user or null', async () => {
  const row = { id: 'u1', email: 'a@b.co', displayName: 'Ada', passwordHash: 'hash' };
  let found = true;
  const store = new TypeOrmCredentialStore({
    getRepository: () => ({ findOne: async () => (found ? row : null) })
  } as unknown as DataSource);
  assert.equal((await store.findByEmail(' A@B.CO '))?.email, 'a@b.co');
  found = false;
  assert.equal(await store.findByEmail('missing'), null);
});
