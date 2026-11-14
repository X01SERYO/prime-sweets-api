import test from 'node:test';
import assert from 'node:assert/strict';
import { DataSource } from 'typeorm';
import { TypeOrmBrandRepository } from '@catalog/adapters/outbound/persistence/repositories/typeOrmBrand.repository';
import { Brand } from '@catalog/domain/entities/brand';

test('TypeOrmBrandRepository maps a brand and returns null when it is missing', async () => {
  let found = true;
  const dataSource = {
    getRepository: () => ({
      save: async () => undefined,
      delete: async () => undefined,
      find: async () => [{ id: 'b1', name: 'ACME', code: 'ACM' }],
      findOne: async () => (found ? { id: 'b1', name: 'ACME', code: 'ACM' } : null)
    })
  } as unknown as DataSource;
  const repository = new TypeOrmBrandRepository(dataSource);
  await repository.save(Brand.create('b1', 'Acme', 'ACM'));
  assert.equal((await repository.findById('b1'))?.code, 'ACM');
  assert.equal((await repository.findByName('ACME'))?.name, 'ACME');
  assert.equal((await repository.findByCode('ACM'))?.id, 'b1');
  assert.equal((await repository.findAll()).length, 1);
  found = false;
  assert.equal(await repository.findById('missing'), null);
  await repository.delete('b1');
});
