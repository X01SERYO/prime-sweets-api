import test from 'node:test';
import assert from 'node:assert/strict';
import { VoidSaleUseCase } from './voidSale.useCase';
import { Sale } from '../../../domain/entities/sale';
import { SaleItem } from '../../../domain/entities/saleItem';
import { SaleRepository } from '../../ports/outbound/sale.repository';
import { SalesDayStatusChecker } from '../../ports/outbound/salesDayStatusChecker.port';
import { SaleAlreadyVoidedError } from '../../../domain/errors/saleAlreadyVoided.error';
import { SalesDayNotOpenForSaleError } from '../../../domain/errors/salesDayNotOpenForSale.error';

test('VoidSaleUseCase - voids confirmed sale preserving invoice number', async () => {
  const item = SaleItem.create({
    id: 'it-1',
    productId: 'p-1',
    itemName: 'Item 1',
    quantity: 2,
    wholesalePrice: 1000,
    wholesaleCost: 600
  });
  const confirmed = Sale.create({ id: 's-1', salesDayId: 'sd-1', customerId: 'c-1' })
    .addItem(item)
    .confirm('INV-0001');

  let saved: Sale = confirmed;
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

  const useCase = new VoidSaleUseCase(repo, salesDayChecker);
  const result = await useCase.run({ saleId: 's-1' });

  assert.equal(result.isSuccess, true);
  assert.equal(result.value?.status, 'VOIDED');
  assert.equal(result.value?.invoiceNumber, 'INV-0001');
  assert.ok(result.value?.voidedAt);
});

test('VoidSaleUseCase - fails if already voided', async () => {
  const item = SaleItem.create({
    id: 'it-1',
    productId: 'p-1',
    itemName: 'Item 1',
    quantity: 2,
    wholesalePrice: 1000,
    wholesaleCost: 600
  });
  const voided = Sale.create({ id: 's-1', salesDayId: 'sd-1', customerId: 'c-1' })
    .addItem(item)
    .confirm('INV-0001')
    .void();

  const repo: SaleRepository = {
    async save() {},
    async findById() {
      return voided;
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

  const useCase = new VoidSaleUseCase(repo, salesDayChecker);
  const result = await useCase.run({ saleId: 's-1' });

  assert.equal(result.isSuccess, false);
  assert.ok(result.error instanceof SaleAlreadyVoidedError);
});

test('VoidSaleUseCase - fails if sales day is closed', async () => {
  const item = SaleItem.create({
    id: 'it-1',
    productId: 'p-1',
    itemName: 'Item 1',
    quantity: 2,
    wholesalePrice: 1000,
    wholesaleCost: 600
  });
  const confirmed = Sale.create({ id: 's-1', salesDayId: 'sd-1', customerId: 'c-1' })
    .addItem(item)
    .confirm('INV-0001');

  const repo: SaleRepository = {
    async save() {},
    async findById() {
      return confirmed;
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

  const useCase = new VoidSaleUseCase(repo, salesDayChecker);
  const result = await useCase.run({ saleId: 's-1' });

  assert.equal(result.isSuccess, false);
  assert.ok(result.error instanceof SalesDayNotOpenForSaleError);
});
