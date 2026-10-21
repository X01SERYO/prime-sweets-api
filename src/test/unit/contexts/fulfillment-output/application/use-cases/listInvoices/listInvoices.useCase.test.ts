import test from 'node:test';
import assert from 'node:assert/strict';
import { ListInvoicesUseCase } from '../../../../../../../contexts/fulfillment-output/application/use-cases/listInvoices/listInvoices.useCase';
import { SalesDayClosureQuery } from '../../../../../../../contexts/fulfillment-output/application/ports/outbound/salesDayClosureQuery.port';
import { InvoiceQuery, InvoiceSummary } from '../../../../../../../contexts/fulfillment-output/application/ports/outbound/invoiceQuery.port';
import { SalesDayNotFoundForInvoiceError } from '../../../../../../../contexts/fulfillment-output/domain/errors/salesDayNotFoundForInvoice.error';

function setup(status: 'OPEN' | 'CLOSED' | null) {
  let invoicesRequested = false;
  const invoices: InvoiceSummary[] = [
    {
      saleId: 's-2',
      salesDayId: 'sd-1',
      customerId: 'c-2',
      invoiceNumber: 'INV-00002',
      status: 'VOIDED',
      confirmedAt: '2026-10-13T15:00:00.000Z',
      totalAmount: 2000
    },
    {
      saleId: 's-1',
      salesDayId: 'sd-1',
      customerId: 'c-1',
      invoiceNumber: 'INV-00001',
      status: 'CONFIRMED',
      confirmedAt: '2026-10-13T14:00:00.000Z',
      totalAmount: 1000
    }
  ];

  const salesDayClosureQuery: SalesDayClosureQuery = {
    async findById(salesDayId) {
      if (!status) return null;
      return { id: salesDayId, status };
    }
  };

  const invoiceQuery: InvoiceQuery = {
    async findBySalesDayId() {
      invoicesRequested = true;
      return invoices;
    }
  };

  return {
    useCase: new ListInvoicesUseCase(salesDayClosureQuery, invoiceQuery),
    wasInvoicesRequested: () => invoicesRequested
  };
}

test('ListInvoicesUseCase - returns allocated invoices ordered by invoice number for an open Sales Day', async () => {
  const { useCase } = setup('OPEN');

  const result = await useCase.run({ salesDayId: 'sd-1' });

  assert.equal(result.isSuccess, true);
  assert.deepEqual(
    result.value?.map(invoice => invoice.invoiceNumber),
    ['INV-00001', 'INV-00002']
  );
  assert.equal(result.value?.[1].status, 'VOIDED');
});

test('ListInvoicesUseCase - returns allocated invoices when the Sales Day is closed', async () => {
  const { useCase } = setup('CLOSED');

  const result = await useCase.run({ salesDayId: 'sd-1' });

  assert.equal(result.isSuccess, true);
  assert.equal(result.value?.length, 2);
});

test('ListInvoicesUseCase - orders numeric invoice numbers so 1000 follows 999', async () => {
  const salesDayClosureQuery: SalesDayClosureQuery = {
    async findById(salesDayId) {
      return { id: salesDayId, status: 'OPEN' };
    }
  };
  const invoiceQuery: InvoiceQuery = {
    async findBySalesDayId() {
      return [
        {
          saleId: 's-1000',
          salesDayId: 'sd-1',
          customerId: 'c-2',
          invoiceNumber: '1000',
          status: 'CONFIRMED',
          confirmedAt: '2026-10-13T15:00:00.000Z',
          totalAmount: 2000
        },
        {
          saleId: 's-999',
          salesDayId: 'sd-1',
          customerId: 'c-1',
          invoiceNumber: '999',
          status: 'CONFIRMED',
          confirmedAt: '2026-10-13T14:00:00.000Z',
          totalAmount: 1000
        }
      ];
    }
  };
  const useCase = new ListInvoicesUseCase(salesDayClosureQuery, invoiceQuery);

  const result = await useCase.run({ salesDayId: 'sd-1' });

  assert.deepEqual(
    result.value?.map(invoice => invoice.invoiceNumber),
    ['999', '1000']
  );
});

test('ListInvoicesUseCase - fails when the Sales Day does not exist', async () => {
  const { useCase, wasInvoicesRequested } = setup(null);

  const result = await useCase.run({ salesDayId: 'missing' });

  assert.equal(result.isSuccess, false);
  assert.ok(result.error instanceof SalesDayNotFoundForInvoiceError);
  assert.equal(wasInvoicesRequested(), false);
});
