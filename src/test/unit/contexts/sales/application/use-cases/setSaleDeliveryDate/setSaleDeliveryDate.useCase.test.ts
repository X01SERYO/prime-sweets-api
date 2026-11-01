import test from 'node:test';
import assert from 'node:assert/strict';
import { SetSaleDeliveryDateUseCase } from '../../../../../../../contexts/sales/application/use-cases/setSaleDeliveryDate/setSaleDeliveryDate.useCase';
import { Sale } from '../../../../../../../contexts/sales/domain/entities/sale';
import { SaleItem } from '../../../../../../../contexts/sales/domain/entities/saleItem';
import { SaleRepository } from '../../../../../../../contexts/sales/application/ports/outbound/sale.repository';
import { SaleBatch } from '../../../../../../../contexts/sales/application/ports/outbound/saleBatch.port';
import { BusinessCalendar } from '../../../../../../../contexts/sales/application/ports/outbound/businessCalendar.port';
import { InvoiceNumberAllocator } from '../../../../../../../contexts/sales/application/ports/outbound/invoiceNumberAllocator.port';
import { SaleAlreadyVoidedError } from '../../../../../../../contexts/sales/domain/errors/saleAlreadyVoided.error';
import { DeliveryDateOutOfRangeError } from '../../../../../../../contexts/sales/domain/errors/deliveryDateOutOfRange.error';

const calendar: BusinessCalendar = { today: () => '2026-11-04' };
const allocator: InvoiceNumberAllocator = { allocateNext: async () => '004' };
const ids = { next: () => 'new-id' };

function item() {
  return SaleItem.create({
    id: 'it-1',
    productId: 'p-1',
    productCode: 'COL001',
    itemName: 'Caja verde',
    quantity: 2,
    wholesalePrice: 1000,
    wholesaleCost: 600
  });
}

function repositoryWith(initial: Sale): SaleRepository & { saved: Sale[] } {
  let current = initial;
  const saved: Sale[] = [];
  return {
    saved,
    async save(sale) {
      saved.push(sale);
      if (sale.id === current.id) current = sale;
    },
    async findById(id) {
      return current.id === id ? current : null;
    },
    async list() {
      return [];
    }
  };
}

test('SetSaleDeliveryDateUseCase - updates a draft in place', async () => {
  const repo = repositoryWith(
    Sale.create({
      id: 's-1',
      sellerId: 'seller-1',
      customerId: 'c-1',
      captureDate: '2026-11-04',
      deliveryDate: '2026-11-05'
    }).addItem(item())
  );
  const batch: SaleBatch = { saveAll: async () => {} };
  const useCase = new SetSaleDeliveryDateUseCase(repo, batch, calendar, allocator, ids);

  const result = await useCase.run({ saleId: 's-1', deliveryDate: '2026-11-08' });

  assert.equal(result.isSuccess, true);
  assert.equal(result.value?.id, 's-1');
  assert.equal(result.value?.deliveryDate, '2026-11-08');
  assert.equal(result.value?.status, 'DRAFT');
  assert.equal(repo.saved.length, 1);
});

test('SetSaleDeliveryDateUseCase - voids a confirmed sale and confirms a new one for the new date', async () => {
  const original = Sale.create({
    id: 's-1',
    sellerId: 'seller-1',
    customerId: 'c-1',
    captureDate: '2026-11-02',
    deliveryDate: '2026-11-05'
  })
    .addItem(item())
    .confirm('001', '2026-11-02');
  const repo = repositoryWith(original);
  let batch: Sale[] = [];
  const useCase = new SetSaleDeliveryDateUseCase(
    repo,
    { saveAll: async sales => { batch = sales; } },
    calendar,
    allocator,
    { next: (() => { let n = 0; return () => `id-${++n}`; })() }
  );

  const result = await useCase.run({ saleId: 's-1', deliveryDate: '2026-11-08' });

  assert.equal(result.value?.id, 'id-1');
  assert.equal(result.value?.status, 'CONFIRMED');
  assert.equal(result.value?.invoiceNumber, '004');
  assert.equal(result.value?.invoiceBusinessDate, '2026-11-04');
  assert.equal(result.value?.deliveryDate, '2026-11-08');
  assert.equal(result.value?.captureDate, '2026-11-02');
  assert.equal(result.value?.sellerId, 'seller-1');
  assert.equal(result.value?.items.length, 1);
  assert.equal(result.value?.items[0].id, 'id-2');
  assert.equal(result.value?.items[0].quantity, 2);
  assert.equal(batch.length, 2);
  assert.equal(batch[0].id, 's-1');
  assert.equal(batch[0].status, 'VOIDED');
  assert.equal(batch[0].invoiceNumber, '001');
  assert.equal(batch[0].deliveryDate, '2026-11-05');
  assert.equal(batch[1].id, result.value?.id);
});

test('SetSaleDeliveryDateUseCase - same date does not save', async () => {
  const repo = repositoryWith(
    Sale.create({
      id: 's-1',
      sellerId: 'seller-1',
      customerId: 'c-1',
      captureDate: '2026-11-04',
      deliveryDate: '2026-11-05'
    })
  );
  let called = false;
  const useCase = new SetSaleDeliveryDateUseCase(
    repo,
    { saveAll: async () => { called = true; } },
    calendar,
    allocator,
    ids
  );

  const result = await useCase.run({ saleId: 's-1', deliveryDate: '2026-11-05' });

  assert.equal(result.value?.id, 's-1');
  assert.equal(repo.saved.length, 0);
  assert.equal(called, false);
});

test('SetSaleDeliveryDateUseCase - rejects a voided sale and a date outside the week', async () => {
  const voided = Sale.create({
    id: 's-1',
    sellerId: 'seller-1',
    customerId: 'c-1',
    captureDate: '2026-11-04',
    deliveryDate: '2026-11-05',
    status: 'VOIDED'
  });
  const useCase = new SetSaleDeliveryDateUseCase(repositoryWith(voided), { saveAll: async () => {} }, calendar, allocator, ids);

  const voidedResult = await useCase.run({ saleId: 's-1', deliveryDate: '2026-11-08' });
  const rangeResult = await new SetSaleDeliveryDateUseCase(
    repositoryWith(
      Sale.create({
        id: 's-2',
        sellerId: 'seller-1',
        customerId: 'c-1',
        captureDate: '2026-11-04',
        deliveryDate: '2026-11-05'
      })
    ),
    { saveAll: async () => {} },
    calendar,
    allocator,
    ids
  ).run({ saleId: 's-2', deliveryDate: '2026-11-09' });

  assert.ok(voidedResult.error instanceof SaleAlreadyVoidedError);
  assert.ok(rangeResult.error instanceof DeliveryDateOutOfRangeError);
});
