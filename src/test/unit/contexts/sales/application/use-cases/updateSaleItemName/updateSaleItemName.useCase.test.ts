import test from 'node:test';
import assert from 'node:assert/strict';
import { UpdateSaleItemNameUseCase } from '../../../../../../../contexts/sales/application/use-cases/updateSaleItemName/updateSaleItemName.useCase';
import { Sale } from '../../../../../../../contexts/sales/domain/entities/sale';
import { SaleItem } from '../../../../../../../contexts/sales/domain/entities/saleItem';
import { SaleRepository } from '../../../../../../../contexts/sales/application/ports/outbound/sale.repository';
import { SalesDayStatusChecker } from '../../../../../../../contexts/sales/application/ports/outbound/salesDayStatusChecker.port';

test('UpdateSaleItemNameUseCase - modifies transaction-time item name during draft', async () => {
  const item = SaleItem.create({
    id: 'it-1',
    productId: 'p-1',
    itemName: 'Original Name',
    quantity: 2,
    wholesalePrice: 1000,
    wholesaleCost: 600
  });
  const sale = Sale.create({ id: 's-1', salesDayId: 'sd-1', customerId: 'c-1' }).addItem(item);

  let saved: Sale = sale;
  const repo: SaleRepository = {
    async save(s) {
      saved = s;
    },
    async findById() {
      return saved;
    },
    async findBySalesDayId() {
      return [];
    },
    async list() {
      return [];
    }
  };

  const salesDayChecker: SalesDayStatusChecker = {
    async isSalesDayOpen() {
      return true;
    }
  };

  const useCase = new UpdateSaleItemNameUseCase(repo, salesDayChecker);
  const result = await useCase.run({
    saleId: 's-1',
    itemId: 'it-1',
    itemName: 'Nombre Personalizado en Tienda'
  });

  assert.equal(result.isSuccess, true);
  assert.equal(result.value?.items[0].itemName, 'Nombre Personalizado en Tienda');
  assert.equal(result.value?.items[0].productId, 'p-1');
});
