import test from 'node:test';
import assert from 'node:assert/strict';
import { ConfirmSaleUseCase } from './confirmSale.useCase';
import { Sale } from '../../../domain/entities/sale';
import { SaleItem } from '../../../domain/entities/saleItem';
import { SaleRepository } from '../../ports/outbound/sale.repository';
import { SalesDayStatusChecker } from '../../ports/outbound/salesDayStatusChecker.port';
import { InvoiceNumberAllocator } from '../../ports/outbound/invoiceNumberAllocator.port';
import { SaleCannotBeModifiedError } from '../../../domain/errors/saleCannotBeModified.error';
import { SalesDayNotOpenForSaleError } from '../../../domain/errors/salesDayNotOpenForSale.error';
import { SaleMustContainItemsError } from '../../../domain/errors/saleMustContainItems.error';

function setup() {
  let counter = 1;
  const allocator: InvoiceNumberAllocator = {
    async allocateNext() {
      const num = `INV-${String(counter++).padStart(5, '0')}`;
      return num;
    }
  };

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

  let isOpen = true;
  const salesDayChecker: SalesDayStatusChecker = {
    async isSalesDayOpen() {
      return isOpen;
    }
  };

  return {
    repo,
    salesDayChecker,
    allocator,
    setIsOpen: (val: boolean) => {
      isOpen = val;
    }
  };
}

test('ConfirmSaleUseCase - confirms draft sale and assigns invoice number', async () => {
  const { repo, salesDayChecker, allocator } = setup();
  const useCase = new ConfirmSaleUseCase(repo, salesDayChecker, allocator);

  const result = await useCase.run({ saleId: 's-1' });

  assert.equal(result.isSuccess, true);
  assert.equal(result.value?.status, 'CONFIRMED');
  assert.equal(result.value?.invoiceNumber, 'INV-00001');
  assert.ok(result.value?.confirmedAt);
});

test('ConfirmSaleUseCase - fails if already confirmed', async () => {
  const { repo, salesDayChecker, allocator } = setup();
  const useCase = new ConfirmSaleUseCase(repo, salesDayChecker, allocator);

  await useCase.run({ saleId: 's-1' });
  const retry = await useCase.run({ saleId: 's-1' });

  assert.equal(retry.isSuccess, false);
  assert.ok(retry.error instanceof SaleCannotBeModifiedError);
});

test('ConfirmSaleUseCase - fails if sales day is closed', async () => {
  const { repo, salesDayChecker, allocator, setIsOpen } = setup();
  setIsOpen(false);
  const useCase = new ConfirmSaleUseCase(repo, salesDayChecker, allocator);

  const result = await useCase.run({ saleId: 's-1' });

  assert.equal(result.isSuccess, false);
  assert.ok(result.error instanceof SalesDayNotOpenForSaleError);
});

test('ConfirmSaleUseCase - fails if sale has no items', async () => {
  const emptySale = Sale.create({ id: 's-empty', salesDayId: 'sd-1', customerId: 'c-1' });
  const repo: SaleRepository = {
    async save() {},
    async findById() {
      return emptySale;
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

  const allocator: InvoiceNumberAllocator = {
    async allocateNext() {
      return 'INV-999';
    }
  };

  const useCase = new ConfirmSaleUseCase(repo, salesDayChecker, allocator);
  const result = await useCase.run({ saleId: 's-empty' });

  assert.equal(result.isSuccess, false);
  assert.ok(result.error instanceof SaleMustContainItemsError);
});
