import test from 'node:test';
import assert from 'node:assert/strict';
import { UpdateSaleItemNameUseCase } from '../../../../../../../contexts/sales/application/use-cases/updateSaleItemName/updateSaleItemName.useCase';
import { Sale } from '../../../../../../../contexts/sales/domain/entities/sale';
import { SaleItem } from '../../../../../../../contexts/sales/domain/entities/saleItem';
import { SaleRepository } from '../../../../../../../contexts/sales/application/ports/outbound/sale.repository';

test('UpdateSaleItemNameUseCase - modifies transaction-time item name during draft', async () => {
  const item = SaleItem.create({
    id: 'it-1',
    productId: 'p-1',
    itemName: 'Original Name',
    quantity: 2,
    wholesalePrice: 1000,
    wholesaleCost: 600
  });
  const sale = Sale.create({ id: 's-1', sellerId: 'seller-1', captureDate: '2026-11-04', customerId: 'c-1', deliveryDate: '2026-10-31' }).addItem(item);

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

  const useCase = new UpdateSaleItemNameUseCase(repo);
  const result = await useCase.run({
    saleId: 's-1',
    itemId: 'it-1',
    itemName: 'Nombre Personalizado en Tienda'
  });

  assert.equal(result.isSuccess, true);
  assert.equal(result.value?.items[0].itemName, 'Nombre Personalizado en Tienda');
  assert.equal(result.value?.items[0].productId, 'p-1');
});
