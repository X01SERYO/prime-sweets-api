import test from 'node:test';
import assert from 'node:assert/strict';
import { InvoiceSaleAdapter } from '../../../../../../contexts/fulfillment-output/adapters/outbound/invoiceSale.adapter';
import { SaleRepository } from '../../../../../../contexts/sales/application/ports/outbound/sale.repository';
import { Sale } from '../../../../../../contexts/sales/domain/entities/sale';
import { SaleItem } from '../../../../../../contexts/sales/domain/entities/saleItem';

test('InvoiceSaleAdapter - projects the transaction-time item name and does not save the sale', async () => {
  let saved = false;
  const item = SaleItem.create({
    id: 'i-1',
    productId: 'p-1',
    itemName: 'Custom label',
    quantity: 2,
    wholesalePrice: 1000,
    wholesaleCost: 600
  });
  const sale = Sale.create({
    id: 's-1',
    salesDayId: 'sd-1',
    customerId: 'c-1',
    status: 'CONFIRMED',
    invoiceNumber: 'INV-00001',
    items: [item],
    confirmedAt: new Date('2026-10-13T15:00:00.000Z')
  });
  const repository: SaleRepository = {
    async save() {
      saved = true;
    },
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

  const view = await new InvoiceSaleAdapter(repository).findById('s-1');

  assert.equal(saved, false);
  assert.equal(view?.invoiceNumber, 'INV-00001');
  assert.equal(view?.lines[0].itemName, 'Custom label');
  assert.equal(view?.lines[0].unitValue, 1000);
  assert.equal(view?.lines[0].totalValue, 2000);
  assert.equal('profit' in (view?.lines[0] ?? {}), false);
});
