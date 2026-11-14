import test from 'node:test';
import assert from 'node:assert/strict';
import { DataSource } from 'typeorm';
import { TypeOrmCustomerRepository } from '@/contexts/customers/adapters/outbound/persistence/repositories/typeOrmCustomer.repository';
import { Customer } from '@/contexts/customers/domain/entities/customer';
import { CustomerAlreadyExistsError } from '@/contexts/customers/domain/errors/customerAlreadyExists.error';

const row = {
  id: 'c1',
  documentType: 'CC',
  documentNumber: '1',
  name: 'ANA',
  phone: null,
  email: null,
  address: null
};

function dataSource(saveError?: unknown): DataSource {
  const self = {
    where: () => self,
    andWhere: () => self,
    orWhere: () => self,
    orderBy: () => self,
    getOne: async () => row,
    getMany: async () => [row]
  };
  return {
    getRepository: () => ({
      findOne: async () => row,
      find: async () => [row],
      createQueryBuilder: () => self,
      save: async () => {
        if (saveError) throw saveError;
      }
    })
  } as unknown as DataSource;
}

test('TypeOrmCustomerRepository maps rows and translates a duplicate document', async () => {
  const repository = new TypeOrmCustomerRepository(dataSource());
  assert.equal((await repository.findById('c1'))?.name, 'ANA');
  assert.equal((await repository.findByDocument('cc', '1'))?.documentNumber, '1');
  assert.equal((await repository.search('')).length, 1);
  assert.equal((await repository.search('ana')).length, 1);
  await repository.save(Customer.create({ id: 'c1', documentType: 'CC', documentNumber: '1', name: 'Ana' }));

  const duplicate = new TypeOrmCustomerRepository(
    dataSource({ code: '23505', constraint: 'UQ_customers_document' })
  );
  await assert.rejects(
    () => duplicate.save(Customer.create({ id: 'c2', documentType: 'CC', documentNumber: '1', name: 'Ana' })),
    CustomerAlreadyExistsError
  );
});
