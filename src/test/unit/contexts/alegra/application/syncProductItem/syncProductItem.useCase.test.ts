import test from 'node:test';
import assert from 'node:assert/strict';
import { SyncProductItemUseCase } from '@/contexts/alegra/application/syncProductItem/syncProductItem.useCase';

test('SyncProductItemUseCase sends only the prices that were provided', async () => {
  const updates: unknown[] = [];
  const useCase = new SyncProductItemUseCase(
    { async updateItem(_id, update) { updates.push(update); }, async createItem() { return '1'; } },
    'major',
    'minor'
  );

  await useCase.run({ alegraId: '9', name: 'SODA', wholesalePrice: 0, retailPrice: 10 });
  await useCase.run({ alegraId: '9', name: null });
  assert.equal((updates[0] as { prices: unknown[] }).prices.length, 2);
  assert.equal((updates[1] as { prices: unknown[] }).prices.length, 0);
});
