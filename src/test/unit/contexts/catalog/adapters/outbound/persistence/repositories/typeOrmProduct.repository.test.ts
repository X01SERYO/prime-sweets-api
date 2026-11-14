import test from 'node:test';
import assert from 'node:assert/strict';
import { DataSource } from 'typeorm';
import { TypeOrmProductRepository } from '../../../../../../../../contexts/catalog/adapters/outbound/persistence/repositories/typeOrmProduct.repository';
import { Product } from '../../../../../../../../contexts/catalog/domain/entities/product';

const productRow = {
  id: 'p1',
  alegraId: 'a1',
  code: 'ACM1',
  brandId: 'b1',
  name: 'SODA',
  suggestedPrice: 1,
  units: 1,
  pack: 1,
  brand: { name: 'ACME' },
  prices: [
    { channel: 'wholesale', cost: 1, price: 2, id: 'w' },
    { channel: 'retail', cost: null, price: 3, id: 'r' }
  ]
};

function query(empty = false) {
  let selected = '';
  const self = {
    leftJoinAndSelect: () => self,
    leftJoin: () => self,
    where: () => self,
    orWhere: () => self,
    andWhere: () => self,
    orderBy: () => self,
    addOrderBy: () => self,
    select: (field: string) => {
      selected = field;
      return self;
    },
    clone: () => query(empty),
    offset: () => self,
    limit: () => self,
    getMany: async () => [productRow],
    getCount: async () => (empty ? 0 : 1),
    getRawMany: async () => {
      if (empty) return [];
      return selected.includes('code') ? [{ code: 'ACM1' }, { code: 'OTHER' }] : [{ id: 'p1' }];
    }
  };
  return self;
}

const priceWrites: Array<{ conflict?: string[]; overwrite?: string[]; channel?: string }> = [];

function priceQuery() {
  const write: { conflict?: string[]; overwrite?: string[]; channel?: string } = {};
  const self = {
    insert: () => self,
    into: () => self,
    values: (row: { channel?: string }) => {
      write.channel = row.channel;
      return self;
    },
    orUpdate: (overwrite: string[], conflict: string[]) => {
      write.overwrite = overwrite;
      write.conflict = conflict;
      return self;
    },
    execute: async () => {
      priceWrites.push(write);
    }
  };
  return self;
}

function dataSource(rawEmpty = false): DataSource {
  const productRepo = {
    findOne: async () => productRow,
    find: async () => [productRow],
    delete: async () => undefined,
    save: async () => undefined,
    createQueryBuilder: () => query(rawEmpty)
  };
  const priceRepo = {
    delete: async () => undefined,
    createQueryBuilder: () => priceQuery()
  };
  return {
    getRepository: (entity: { name?: string }) => (entity.name === 'ProductPriceEntity' ? priceRepo : productRepo)
  } as unknown as DataSource;
}

test('TypeOrmProductRepository reads, searches, pages, codes, and saves channel prices', async () => {
  const repository = new TypeOrmProductRepository(dataSource());
  assert.equal((await repository.findById('p1'))?.code, 'ACM1');
  assert.equal((await repository.findByAlegraId('a1'))?.name, 'SODA');
  assert.equal((await repository.findAll()).length, 1);
  assert.equal((await repository.search('')).length, 1);
  assert.equal((await repository.search('soda')).length, 1);
  const page = await repository.page('soda', 1, 10);
  assert.equal(page.total, 1);
  assert.equal(page.items[0].retailPrice, 3);
  assert.equal(await repository.nextProductCode('b1', 'acm'), 'ACM002');
  assert.equal(await repository.nextProductCode(null, 'gen'), 'GEN001');
  await repository.delete('p1');

  const product = Product.create({
    id: 'p1',
    alegraId: 'a1',
    code: 'ACM1',
    wholesalePrice: 2,
    retailPrice: null
  });
  priceWrites.length = 0;
  await repository.save(product);
  assert.equal(priceWrites.length, 1);
  assert.equal(priceWrites[0].channel, 'wholesale');
  assert.deepEqual(priceWrites[0].conflict, ['product_id', 'channel']);
  assert.deepEqual(priceWrites[0].overwrite, ['cost', 'price', 'updated_at']);
});

test('TypeOrmProductRepository returns an empty page when no ids match', async () => {
  const repository = new TypeOrmProductRepository(dataSource(true));
  const page = await repository.page(undefined, 1, 10);
  assert.deepEqual(page.items, []);
  assert.equal(page.total, 0);
});
