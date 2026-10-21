import test from 'node:test';
import assert from 'node:assert/strict';
import { UpdateSaleItemQuantityUseCase } from '../../../../../../../contexts/sales/application/use-cases/updateSaleItemQuantity/updateSaleItemQuantity.useCase';
import { Sale } from '../../../../../../../contexts/sales/domain/entities/sale';
import { SaleItem } from '../../../../../../../contexts/sales/domain/entities/saleItem';
import { SaleRepository } from '../../../../../../../contexts/sales/application/ports/outbound/sale.repository';
import { SalesDayStatusChecker } from '../../../../../../../contexts/sales/application/ports/outbound/salesDayStatusChecker.port';
import { SalesDayNotOpenForSaleError } from '../../../../../../../contexts/sales/domain/errors/salesDayNotOpenForSale.error';

test('UpdateSaleItemQuantityUseCase - updates item quantity', async () => {
  const item = SaleItem.create({
    id: 'it-1',
    productId: 'p-1',
    itemName: 'Item 1',
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

  const useCase = new UpdateSaleItemQuantityUseCase(repo, salesDayChecker);
  const result = await useCase.run({ saleId: 's-1', productId: 'p-1', quantity: 7 });

  assert.equal(result.isSuccess, true);
  assert.equal(result.value?.items[0].quantity, 7);
  assert.equal(result.value?.totalAmount, 7000);
});

test('UpdateSaleItemQuantityUseCase - fails if sales day is closed', async () => {
  const item = SaleItem.create({
    id: 'it-1',
    productId: 'p-1',
    itemName: 'Item 1',
    quantity: 2,
    wholesalePrice: 1000,
    wholesaleCost: 600
  });
  const sale = Sale.create({ id: 's-1', salesDayId: 'sd-1', customerId: 'c-1' }).addItem(item);

  const repo: SaleRepository = {
    async save() {},
    async findById() {
      return sale;
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
      return false;
    }
  };

  const useCase = new UpdateSaleItemQuantityUseCase(repo, salesDayChecker);
  const result = await useCase.run({ saleId: 's-1', productId: 'p-1', quantity: 7 });

  assert.equal(result.isSuccess, false);
  assert.ok(result.error instanceof SalesDayNotOpenForSaleError);
});
