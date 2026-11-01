import test from 'node:test';
import assert from 'node:assert/strict';
import { ListInvoicesUseCase } from '../../../../../../../contexts/fulfillment-output/application/use-cases/listInvoices/listInvoices.useCase';
import { InvoiceQuery, InvoiceSummary } from '../../../../../../../contexts/fulfillment-output/application/ports/outbound/invoiceQuery.port';

function setup(invoices: InvoiceSummary[]) {
  let requestedDate: string | null = null;

  const invoiceQuery: InvoiceQuery = {
    async findByDeliveryDate(deliveryDate) {
      requestedDate = deliveryDate;
      return invoices;
    }
  };

  return {
    useCase: new ListInvoicesUseCase(invoiceQuery),
    requestedDate: () => requestedDate
  };
}

test('ListInvoicesUseCase - returns allocated invoices for a delivery date newest first', async () => {
  const { useCase, requestedDate } = setup([
    {
      saleId: 's-1',
      deliveryDate: '2026-11-05',
      customerId: 'c-1',
      invoiceNumber: 'INV-00001',
      status: 'CONFIRMED',
      confirmedAt: '2026-11-04T14:00:00.000Z',
      totalAmount: 1000
    },
    {
      saleId: 's-2',
      deliveryDate: '2026-11-05',
      customerId: 'c-2',
      invoiceNumber: 'INV-00002',
      status: 'VOIDED',
      confirmedAt: '2026-11-04T15:00:00.000Z',
      totalAmount: 2000
    }
  ]);

  const result = await useCase.run({ deliveryDate: '2026-11-05' });

  assert.equal(result.isSuccess, true);
  assert.equal(requestedDate(), '2026-11-05');
  assert.deepEqual(
    result.value?.map(invoice => invoice.invoiceNumber),
    ['INV-00002', 'INV-00001']
  );
  assert.equal(result.value?.[0].status, 'VOIDED');
});

test('ListInvoicesUseCase - returns an empty list when the delivery date has no invoices', async () => {
  const { useCase } = setup([]);

  const result = await useCase.run({ deliveryDate: '2026-11-06' });

  assert.equal(result.isSuccess, true);
  assert.deepEqual(result.value, []);
});

test('ListInvoicesUseCase - orders numeric invoice numbers so 1000 comes before 999', async () => {
  const { useCase } = setup([
    {
      saleId: 's-999',
      deliveryDate: '2026-11-05',
      customerId: 'c-1',
      invoiceNumber: '999',
      status: 'CONFIRMED',
      confirmedAt: '2026-11-04T14:00:00.000Z',
      totalAmount: 1000
    },
    {
      saleId: 's-1000',
      deliveryDate: '2026-11-05',
      customerId: 'c-2',
      invoiceNumber: '1000',
      status: 'CONFIRMED',
      confirmedAt: '2026-11-04T15:00:00.000Z',
      totalAmount: 2000
    }
  ]);

  const result = await useCase.run({ deliveryDate: '2026-11-05' });

  assert.deepEqual(
    result.value?.map(invoice => invoice.invoiceNumber),
    ['1000', '999']
  );
});
