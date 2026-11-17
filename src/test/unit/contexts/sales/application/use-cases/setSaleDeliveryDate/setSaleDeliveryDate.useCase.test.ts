import test from 'node:test';
import assert from 'node:assert/strict';
import { SetSaleDeliveryDateUseCase } from '@/contexts/sales/application/use-cases/setSaleDeliveryDate/setSaleDeliveryDate.useCase';
import { Sale } from '@/contexts/sales/domain/entities/sale';
import { SaleItem } from '@/contexts/sales/domain/entities/saleItem';
import { SaleRepository } from '@/contexts/sales/application/ports/outbound/sale.repository';
import { BusinessCalendar } from '@/shared/application/ports/businessCalendar';
import { InvoiceNumberAllocator } from '@/contexts/sales/application/ports/outbound/invoiceNumberAllocator.port';
import { SaleAlreadyVoidedError } from '@/contexts/sales/domain/errors/saleAlreadyVoided.error';
import { DeliveryDateOutOfRangeError } from '@/contexts/sales/domain/errors/deliveryDateOutOfRange.error';

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

test('SetSaleDeliveryDateUseCase - voids the current sale and creates another for the selected day', async () => {
  const repo = repositoryWith(
    Sale.create({
      id: 's-1',
      sellerId: 'seller-1',
      customerId: 'c-1',
      captureDate: '2026-11-04',
      deliveryDate: '2026-11-05'
    }).addItem(item())
  );
  let batch: Sale[] = [];
  const useCase = new SetSaleDeliveryDateUseCase(
    repo,
    { saveAll: async sales => { batch = sales; }, discard: async () => {} },
    calendar,
    allocator,
    { next: (() => { let n = 0; return () => `id-${++n}`; })() }
  );

  const result = await useCase.run({ saleId: 's-1', deliveryDate: '2026-11-08' });

  assert.equal(result.isSuccess, true);
  assert.equal(result.value?.id, 'id-1');
  assert.equal(result.value?.deliveryDate, '2026-11-08');
  assert.equal(result.value?.status, 'DRAFT');
  assert.equal(result.value?.items.length, 1);
  assert.equal(batch[0]?.id, 's-1');
  assert.equal(batch[0]?.status, 'VOIDED');
  assert.equal(batch[0]?.deliveryDate, '2026-11-05');
  assert.equal(batch[1]?.id, 'id-1');
});

test('SetSaleDeliveryDateUseCase - a confirmed sale is voided with its invoice and a new draft is created', async () => {
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
    { saveAll: async sales => { batch = sales; }, discard: async () => {} },
    calendar,
    allocator,
    { next: (() => { let n = 0; return () => `id-${++n}`; })() }
  );

  const result = await useCase.run({ saleId: 's-1', deliveryDate: '2026-11-08' });

  assert.equal(result.isSuccess, true);
  assert.equal(batch[0]?.status, 'VOIDED');
  assert.equal(batch[0]?.invoiceNumber, '001');
  assert.equal(batch[0]?.deliveryDate, '2026-11-05');
  assert.equal(result.value?.status, 'DRAFT');
  assert.equal(result.value?.invoiceNumber, null);
  assert.equal(result.value?.deliveryDate, '2026-11-08');
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
    { saveAll: async () => { called = true; }, discard: async () => {} },
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
  const useCase = new SetSaleDeliveryDateUseCase(repositoryWith(voided), { saveAll: async () => {}, discard: async () => {} }, calendar, allocator, ids);

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
    { saveAll: async () => {}, discard: async () => {} },
    calendar,
    allocator,
    ids
  ).run({ saleId: 's-2', deliveryDate: '2026-11-09' });

  assert.ok(voidedResult.error instanceof SaleAlreadyVoidedError);
  assert.ok(rangeResult.error instanceof DeliveryDateOutOfRangeError);
});

test('SetSaleDeliveryDateUseCase - continues the draft that already exists for that customer and day', async () => {
  const moving = Sale.create({
    id: 'moving',
    sellerId: 'seller-1',
    customerId: 'c-1',
    captureDate: '2026-11-04',
    deliveryDate: '2026-11-05'
  }).addItem(item());
  const existing = Sale.create({
    id: 'existing',
    sellerId: 'seller-1',
    customerId: 'c-1',
    captureDate: '2026-11-04',
    deliveryDate: '2026-11-06'
  });
  let batch: Sale[] = [];
  const repo: SaleRepository = {
    async save() {},
    async findById(id) {
      return id === moving.id ? moving : null;
    },
    async list() {
      return [existing];
    }
  };
  const useCase = new SetSaleDeliveryDateUseCase(
    repo,
    { saveAll: async sales => { batch = sales; }, discard: async () => {} },
    calendar,
    allocator,
    ids
  );

  const result = await useCase.run({ saleId: 'moving', deliveryDate: '2026-11-06' });

  assert.equal(result.value?.id, 'existing');
  assert.equal(result.value?.items.length, 1);
  assert.equal(batch[0]?.id, 'moving');
  assert.equal(batch[0]?.status, 'VOIDED');
  assert.equal(batch[0]?.deliveryDate, '2026-11-05');
  assert.equal(batch[1]?.id, 'existing');
});
