import test from 'node:test';
import assert from 'node:assert/strict';
import { InvoiceQueryAdapter } from '../../../../../../contexts/fulfillment-output/adapters/outbound/invoiceQuery.adapter';
import { ListSalesFilters, SaleRepository } from '../../../../../../contexts/sales/application/ports/outbound/sale.repository';
import { Sale } from '../../../../../../contexts/sales/domain/entities/sale';
import { SaleItem } from '../../../../../../contexts/sales/domain/entities/saleItem';

function sale(params: {
  id: string;
  status: 'DRAFT' | 'CONFIRMED' | 'VOIDED';
  invoiceNumber: string | null;
  customerId: string;
}): Sale {
  const item = SaleItem.create({
    id: `${params.id}-item`,
    productId: 'p-1',
    itemName: `Custom ${params.id}`,
    quantity: 2,
    wholesalePrice: 1000,
    wholesaleCost: 600
  });

  return Sale.create({
    id: params.id,
    salesDayId: 'sd-1',
    customerId: params.customerId,
    status: params.status,
    invoiceNumber: params.invoiceNumber,
    items: [item],
    confirmedAt: params.status === 'DRAFT' ? null : new Date('2026-10-13T15:00:00.000Z')
  });
}

test('InvoiceQueryAdapter - returns confirmed and voided invoices and omits drafts and item names', async () => {
  let filters: ListSalesFilters | undefined;
  let saved = false;
  const repository: SaleRepository = {
    async save() {
      saved = true;
    },
    async findById() {
      return null;
    },
    async findBySalesDayId() {
      return [];
    },
    async list(nextFilters) {
      filters = nextFilters;
      return [
        sale({ id: 's-draft', status: 'DRAFT', invoiceNumber: null, customerId: 'c-1' }),
        sale({ id: 's-confirmed', status: 'CONFIRMED', invoiceNumber: 'INV-00002', customerId: 'c-2' }),
        sale({ id: 's-voided', status: 'VOIDED', invoiceNumber: 'INV-00001', customerId: 'c-3' })
      ];
    }
  };

  const invoices = await new InvoiceQueryAdapter(repository).findBySalesDayId('sd-1');

  assert.deepEqual(filters, { salesDayId: 'sd-1' });
  assert.equal(saved, false);
  assert.deepEqual(
    invoices.map(invoice => invoice.saleId),
    ['s-confirmed', 's-voided']
  );
  assert.equal(
    invoices.some(invoice => 'itemName' in invoice || 'items' in invoice),
    false
  );
  assert.equal(invoices[0].invoiceNumber, 'INV-00002');
  assert.equal(invoices[0].totalAmount, 2000);
  assert.equal(invoices[0].confirmedAt, '2026-10-13T15:00:00.000Z');
  assert.equal(invoices[1].status, 'VOIDED');
});
