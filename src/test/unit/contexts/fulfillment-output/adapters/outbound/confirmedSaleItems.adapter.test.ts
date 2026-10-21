import test from 'node:test';
import assert from 'node:assert/strict';
import { ConfirmedSaleItemsAdapter } from '../../../../../../contexts/fulfillment-output/adapters/outbound/confirmedSaleItems.adapter';
import { SaleRepository, ListSalesFilters } from '../../../../../../contexts/sales/application/ports/outbound/sale.repository';
import { Sale } from '../../../../../../contexts/sales/domain/entities/sale';
import { SaleItem } from '../../../../../../contexts/sales/domain/entities/saleItem';

function item(id: string, productId: string, itemName: string, quantity: number): SaleItem {
  return SaleItem.create({
    id,
    productId,
    itemName,
    quantity,
    wholesalePrice: 1000,
    wholesaleCost: 600
  });
}

function sale(id: string, status: 'DRAFT' | 'CONFIRMED' | 'VOIDED', items: SaleItem[]): Sale {
  return Sale.create({
    id,
    salesDayId: 'sd-1',
    customerId: 'c-1',
    status,
    invoiceNumber: status === 'DRAFT' ? null : `INV-${id}`,
    items
  });
}

test('ConfirmedSaleItemsAdapter - reads confirmed sales only and drops transaction-time item names', async () => {
  let filters: ListSalesFilters | undefined;
  const confirmed = sale('s-1', 'CONFIRMED', [
    item('i-1', 'p-1', 'Green Soda', 10),
    item('i-2', 'p-2', 'Custom label', 2)
  ]);
  const repository: SaleRepository = {
    async save() {},
    async findById() {
      return null;
    },
    async findBySalesDayId() {
      return [];
    },
    async list(nextFilters) {
      filters = nextFilters;
      return [
        confirmed,
        sale('s-2', 'VOIDED', [item('i-3', 'p-1', 'Voided name', 99)]),
        sale('s-3', 'DRAFT', [item('i-4', 'p-9', 'Draft name', 4)])
      ];
    }
  };

  const contributions = await new ConfirmedSaleItemsAdapter(repository).findConfirmedBySalesDayId('sd-1');

  assert.deepEqual(filters, { salesDayId: 'sd-1', status: 'CONFIRMED' });
  assert.equal(contributions.length, 2);
  assert.equal(contributions.some((contribution) => 'itemName' in contribution), false);
  assert.deepEqual(
    contributions.map((contribution) => contribution.productId),
    ['p-1', 'p-2']
  );
  assert.equal(contributions[0].quantity, 10);
  assert.equal(contributions[0].totalPrice, 10000);
  assert.equal(contributions[0].profit, 4000);
});
