import test from 'node:test';
import assert from 'node:assert/strict';
import { DataSource } from 'typeorm';
import { TypeOrmSaleRepository } from '@/contexts/sales/adapters/outbound/persistence/repositories/typeOrmSale.repository';
import { Sale } from '@/contexts/sales/domain/entities/sale';
import { SaleItem } from '@/contexts/sales/domain/entities/saleItem';
import { SaleMapper } from '@/contexts/sales/adapters/outbound/persistence/sale.mapper';

function sale(): Sale {
  return Sale.create({
    id: 's-1',
    sellerId: 'seller-1',
    captureDate: '2026-11-14',
    customerId: 'c-1',
    deliveryDate: '2026-11-14'
  }).addItem(
    SaleItem.create({
      id: 'i-1',
      productId: 'p-1',
      itemName: 'Soda',
      quantity: 1,
      wholesalePrice: 1000,
      wholesaleCost: 600
    })
  );
}

test('TypeOrmSaleRepository saves, finds, and filters sales', async () => {
  const stored = SaleMapper.toEntity(sale());
  stored.captureDate = '2026-11-14';
  stored.deliveryDate = '2026-11-14';
  const query = {
    leftJoinAndSelect: () => query,
    andWhere: () => query,
    orderBy: () => query,
    addOrderBy: () => query,
    getMany: async () => [stored]
  };
  const repo = {
    manager: {
      transaction: async (run: (manager: { delete: () => Promise<void>; save: () => Promise<void> }) => Promise<void>) =>
        run({ delete: async () => undefined, save: async () => undefined })
    },
    findOne: async () => stored as unknown,
    createQueryBuilder: () => query
  };
  const dataSource = { getRepository: () => repo } as unknown as DataSource;

  const repository = new TypeOrmSaleRepository(dataSource);
  await repository.save(sale());
  assert.equal((await repository.findById('s-1'))?.id, 's-1');
  const listed = await repository.list({ deliveryDate: '2026-11-14', customerId: 'c-1', status: 'DRAFT' });
  assert.equal(listed.length, 1);
  repo.findOne = async () => null;
  assert.equal(await repository.findById('missing'), null);
});
