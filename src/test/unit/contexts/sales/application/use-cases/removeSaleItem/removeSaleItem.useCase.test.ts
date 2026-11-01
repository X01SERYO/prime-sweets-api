import test from 'node:test';
import assert from 'node:assert/strict';
import { RemoveSaleItemUseCase } from '../../../../../../../contexts/sales/application/use-cases/removeSaleItem/removeSaleItem.useCase';
import { Sale } from '../../../../../../../contexts/sales/domain/entities/sale';
import { SaleItem } from '../../../../../../../contexts/sales/domain/entities/saleItem';
import { SaleRepository } from '../../../../../../../contexts/sales/application/ports/outbound/sale.repository';

test('RemoveSaleItemUseCase - removes item from sale', async () => {
  const item1 = SaleItem.create({
    id: 'it-1',
    productId: 'p-1',
    itemName: 'Item 1',
    quantity: 2,
    wholesalePrice: 1000,
    wholesaleCost: 600
  });
  const item2 = SaleItem.create({
    id: 'it-2',
    productId: 'p-2',
    itemName: 'Item 2',
    quantity: 1,
    wholesalePrice: 500,
    wholesaleCost: 300
  });
  const sale = Sale.create({ id: 's-1', sellerId: 'seller-1', captureDate: '2026-11-04', customerId: 'c-1', deliveryDate: '2026-10-31' })
    .addItem(item1)
    .addItem(item2);

  let saved: Sale = sale;
  const repo: SaleRepository = {
    async save(s) {
      saved = s;
    },
    async findById() {
      return saved;
    },
    async list() {
      return [];
    }
  };

  const useCase = new RemoveSaleItemUseCase(repo);
  const result = await useCase.run({ saleId: 's-1', itemId: 'it-1' });

  assert.equal(result.isSuccess, true);
  assert.equal(result.value?.items.length, 1);
  assert.equal(result.value?.items[0].productId, 'p-2');
});
