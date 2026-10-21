import test from 'node:test';
import assert from 'node:assert/strict';
import { ConfirmSaleUseCase } from '../../../../../../../contexts/sales/application/use-cases/confirmSale/confirmSale.useCase';
import { formatDailyInvoiceNumber } from '../../../../../../../contexts/sales/domain/services/dailyInvoiceNumber';
import { Sale } from '../../../../../../../contexts/sales/domain/entities/sale';
import { SaleItem } from '../../../../../../../contexts/sales/domain/entities/saleItem';
import { SaleRepository } from '../../../../../../../contexts/sales/application/ports/outbound/sale.repository';
import { SalesDayBusinessDateQuery } from '../../../../../../../contexts/sales/application/ports/outbound/salesDayBusinessDate.port';
import { InvoiceNumberAllocator } from '../../../../../../../contexts/sales/application/ports/outbound/invoiceNumberAllocator.port';
import { SaleCannotBeModifiedError } from '../../../../../../../contexts/sales/domain/errors/saleCannotBeModified.error';
import { SalesDayNotOpenForSaleError } from '../../../../../../../contexts/sales/domain/errors/salesDayNotOpenForSale.error';
import { SaleMustContainItemsError } from '../../../../../../../contexts/sales/domain/errors/saleMustContainItems.error';

function dailyAllocator(): InvoiceNumberAllocator {
  const sequences = new Map<string, number>();
  return {
    async allocateNext(businessDate: string) {
      const next = (sequences.get(businessDate) ?? 0) + 1;
      sequences.set(businessDate, next);
      return formatDailyInvoiceNumber(next);
    }
  };
}

function item(id = 'it-1') {
  return SaleItem.create({
    id,
    productId: 'p-1',
    itemName: 'Item 1',
    quantity: 2,
    wholesalePrice: 1000,
    wholesaleCost: 600
  });
}

function repositoryWith(initial: Sale): SaleRepository {
  let saved = initial;
  return {
    async save(sale) {
      saved = sale;
    },
    async findById(id) {
      return saved.id === id ? saved : null;
    },
    async findBySalesDayId() {
      return [];
    },
    async list() {
      return [];
    }
  };
}

test('ConfirmSaleUseCase - assigns 001 then 002 on the same business date and restarts the next date', async () => {
  const first = Sale.create({ id: 's-1', salesDayId: 'sd-1', customerId: 'c-1' }).addItem(item('it-1'));
  const second = Sale.create({ id: 's-2', salesDayId: 'sd-2', customerId: 'c-2' }).addItem(item('it-2'));
  const third = Sale.create({ id: 's-3', salesDayId: 'sd-3', customerId: 'c-3' }).addItem(item('it-3'));
  const sales = new Map<string, Sale>([
    [first.id, first],
    [second.id, second],
    [third.id, third]
  ]);
  const dates = new Map([
    ['sd-1', '2026-10-20'],
    ['sd-2', '2026-10-20'],
    ['sd-3', '2026-10-21']
  ]);
  const repo: SaleRepository = {
    async save(sale) {
      sales.set(sale.id, sale);
    },
    async findById(id) {
      return sales.get(id) ?? null;
    },
    async findBySalesDayId() {
      return [];
    },
    async list() {
      return [];
    }
  };
  const datesQuery: SalesDayBusinessDateQuery = {
    async findOpenBusinessDate(salesDayId) {
      return dates.get(salesDayId) ?? null;
    }
  };
  const useCase = new ConfirmSaleUseCase(repo, datesQuery, dailyAllocator());

  const firstResult = await useCase.run({ saleId: 's-1' });
  const secondResult = await useCase.run({ saleId: 's-2' });
  const thirdResult = await useCase.run({ saleId: 's-3' });

  assert.equal(firstResult.value?.invoiceNumber, '001');
  assert.equal(firstResult.value?.invoiceBusinessDate, '2026-10-20');
  assert.equal(secondResult.value?.invoiceNumber, '002');
  assert.equal(secondResult.value?.invoiceBusinessDate, '2026-10-20');
  assert.equal(thirdResult.value?.invoiceNumber, '001');
  assert.equal(thirdResult.value?.invoiceBusinessDate, '2026-10-21');
});

test('ConfirmSaleUseCase - fails if already confirmed', async () => {
  const sale = Sale.create({ id: 's-1', salesDayId: 'sd-1', customerId: 'c-1' }).addItem(item());
  const repo = repositoryWith(sale);
  const datesQuery: SalesDayBusinessDateQuery = {
    async findOpenBusinessDate() {
      return '2026-10-20';
    }
  };
  const useCase = new ConfirmSaleUseCase(repo, datesQuery, dailyAllocator());

  await useCase.run({ saleId: 's-1' });
  const retry = await useCase.run({ saleId: 's-1' });

  assert.equal(retry.isSuccess, false);
  assert.ok(retry.error instanceof SaleCannotBeModifiedError);
});

test('ConfirmSaleUseCase - fails if sales day is closed', async () => {
  const sale = Sale.create({ id: 's-1', salesDayId: 'sd-1', customerId: 'c-1' }).addItem(item());
  const repo = repositoryWith(sale);
  const datesQuery: SalesDayBusinessDateQuery = {
    async findOpenBusinessDate() {
      return null;
    }
  };
  const useCase = new ConfirmSaleUseCase(repo, datesQuery, dailyAllocator());

  const result = await useCase.run({ saleId: 's-1' });

  assert.equal(result.isSuccess, false);
  assert.ok(result.error instanceof SalesDayNotOpenForSaleError);
});

test('ConfirmSaleUseCase - fails if sale has no items', async () => {
  const emptySale = Sale.create({ id: 's-empty', salesDayId: 'sd-1', customerId: 'c-1' });
  const repo = repositoryWith(emptySale);
  const datesQuery: SalesDayBusinessDateQuery = {
    async findOpenBusinessDate() {
      return '2026-10-20';
    }
  };
  const useCase = new ConfirmSaleUseCase(repo, datesQuery, dailyAllocator());
  const result = await useCase.run({ saleId: 's-empty' });

  assert.equal(result.isSuccess, false);
  assert.ok(result.error instanceof SaleMustContainItemsError);
});
