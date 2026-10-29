import test from 'node:test';
import assert from 'node:assert/strict';
import { Sale } from '../../../../../../contexts/sales/domain/entities/sale';
import { SaleItem } from '../../../../../../contexts/sales/domain/entities/saleItem';
import { InvalidSaleError } from '../../../../../../contexts/sales/domain/errors/invalidSale.error';
import { SaleMustContainItemsError } from '../../../../../../contexts/sales/domain/errors/saleMustContainItems.error';
import { SaleCannotBeModifiedError } from '../../../../../../contexts/sales/domain/errors/saleCannotBeModified.error';
import { SaleAlreadyVoidedError } from '../../../../../../contexts/sales/domain/errors/saleAlreadyVoided.error';

function createSampleItem(productId = 'p-1', quantity = 2, price = 1000, cost = 700) {
  return SaleItem.create({
    id: `item-${productId}`,
    productId,
    itemName: `Product ${productId}`,
    quantity,
    wholesalePrice: price,
    wholesaleCost: cost
  });
}

test('Sale aggregate - creates a draft sale with zero totals by default', () => {
  const sale = Sale.create({
    id: 'sale-001',
    salesDayId: 'sd-100',
    customerId: 'cust-50'
  });

  assert.equal(sale.id, 'sale-001');
  assert.equal(sale.salesDayId, 'sd-100');
  assert.equal(sale.customerId, 'cust-50');
  assert.equal(sale.status, 'DRAFT');
  assert.equal(sale.isDraft(), true);
  assert.equal(sale.isConfirmed(), false);
  assert.equal(sale.isVoided(), false);
  assert.equal(sale.invoiceNumber, null);
  assert.equal(sale.totalAmount, 0);
  assert.equal(sale.totalProfit, 0);
  assert.equal(sale.totalQuantity, 0);
});

test('Sale aggregate - adds items and aggregates quantities, total amount, and profit correctly', () => {
  const sale = Sale.create({
    id: 'sale-001',
    salesDayId: 'sd-100',
    customerId: 'cust-50'
  });

  // item1: qty 2, price 1000, cost 700 => totalPrice 2000, profit 600
  const item1 = createSampleItem('p-1', 2, 1000, 700);
  // item2: qty 3, price 2000, cost 1500 => totalPrice 6000, profit 1500
  const item2 = createSampleItem('p-2', 3, 2000, 1500);

  const updatedSale = sale.addItem(item1).addItem(item2);

  assert.equal(updatedSale.items.length, 2);
  assert.equal(updatedSale.totalQuantity, 5);
  assert.equal(updatedSale.totalAmount, 8000); // 2000 + 6000
  assert.equal(updatedSale.totalProfit, 2100); // 600 + 1500
});

test('Sale aggregate - same product with different names stays as separate lines', () => {
  const sale = Sale.create({
    id: 'sale-001',
    salesDayId: 'sd-100',
    customerId: 'cust-50'
  });

  const green = SaleItem.create({
    id: 'item-green',
    productId: 'p-1',
    itemName: 'Caja A verde',
    quantity: 2,
    wholesalePrice: 1000,
    wholesaleCost: 700,
    createdAt: new Date('2026-10-29T10:00:00.000Z')
  });
  const blue = SaleItem.create({
    id: 'item-blue',
    productId: 'p-1',
    itemName: 'Caja A azul',
    quantity: 3,
    wholesalePrice: 1000,
    wholesaleCost: 700,
    createdAt: new Date('2026-10-29T11:00:00.000Z')
  });

  const updated = sale.addItem(green).addItem(blue);

  assert.equal(updated.items.length, 2);
  assert.equal(updated.items[0].itemName, 'Caja A azul');
  assert.equal(updated.items[1].itemName, 'Caja A verde');
  assert.equal(updated.totalQuantity, 5);
  assert.equal(updated.totalAmount, 5000);
});

test('Sale aggregate - same product and same name accumulates quantity', () => {
  const sale = Sale.create({
    id: 'sale-001',
    salesDayId: 'sd-100',
    customerId: 'cust-50'
  });

  const first = SaleItem.create({
    id: 'item-green-1',
    productId: 'p-1',
    itemName: 'Caja A verde',
    quantity: 1,
    wholesalePrice: 1000,
    wholesaleCost: 700
  });
  const second = SaleItem.create({
    id: 'item-green-2',
    productId: 'p-1',
    itemName: 'caja a verde',
    quantity: 2,
    wholesalePrice: 1000,
    wholesaleCost: 700
  });

  const updated = sale.addItem(first).addItem(second);

  assert.equal(updated.items.length, 1);
  assert.equal(updated.items[0].id, 'item-green-1');
  assert.equal(updated.items[0].itemName, 'Caja A verde');
  assert.equal(updated.items[0].quantity, 3);
  assert.equal(updated.totalAmount, 3000);
});

test('Sale aggregate - updates item quantity and custom item name in draft', () => {
  const sale = Sale.create({
    id: 'sale-001',
    salesDayId: 'sd-100',
    customerId: 'cust-50'
  }).addItem(createSampleItem('p-1', 2, 1000, 700));

  const modifiedQty = sale.updateItemQuantity('item-p-1', 10);
  assert.equal(modifiedQty.totalQuantity, 10);
  assert.equal(modifiedQty.totalAmount, 10000);

  const modifiedName = modifiedQty.updateItemName('item-p-1', 'Nombre Personalizado de Factura');
  assert.equal(modifiedName.items[0].itemName, 'Nombre Personalizado de Factura');
  assert.equal(modifiedName.items[0].productId, 'p-1');
});

test('Sale aggregate - removes item from draft', () => {
  const sale = Sale.create({
    id: 'sale-001',
    salesDayId: 'sd-100',
    customerId: 'cust-50'
  })
    .addItem(createSampleItem('p-1', 2, 1000, 700))
    .addItem(createSampleItem('p-2', 3, 2000, 1500));

  const removed = sale.removeItem('item-p-1');
  assert.equal(removed.items.length, 1);
  assert.equal(removed.items[0].productId, 'p-2');
  assert.equal(removed.totalQuantity, 3);
});

test('Sale aggregate - confirms draft sale, allocating invoice number', () => {
  const sale = Sale.create({
    id: 'sale-001',
    salesDayId: 'sd-100',
    customerId: 'cust-50'
  }).addItem(createSampleItem('p-1', 2, 1000, 700));

  const confirmed = sale.confirm('INV-0001', '2026-10-20');

  assert.equal(confirmed.status, 'CONFIRMED');
  assert.equal(confirmed.isConfirmed(), true);
  assert.equal(confirmed.isDraft(), false);
  assert.equal(confirmed.invoiceNumber, 'INV-0001');
  assert.equal(confirmed.invoiceBusinessDate, '2026-10-20');
  assert.ok(confirmed.confirmedAt);
});

test('Sale aggregate - rejects confirmation if sale has no items', () => {
  const emptySale = Sale.create({
    id: 'sale-001',
    salesDayId: 'sd-100',
    customerId: 'cust-50'
  });

  assert.throws(() => emptySale.confirm('INV-0001', '2026-10-20'), SaleMustContainItemsError);
});

test('Sale aggregate - rejects confirmation if invoice number is missing or empty', () => {
  const sale = Sale.create({
    id: 'sale-001',
    salesDayId: 'sd-100',
    customerId: 'cust-50'
  }).addItem(createSampleItem('p-1', 2, 1000, 700));

  assert.throws(() => sale.confirm('', '2026-10-20'), InvalidSaleError);
  assert.throws(() => sale.confirm('   ', '2026-10-20'), InvalidSaleError);
});

test('Sale aggregate - confirms only once', () => {
  const confirmed = Sale.create({
    id: 'sale-001',
    salesDayId: 'sd-100',
    customerId: 'cust-50'
  })
    .addItem(createSampleItem('p-1', 2, 1000, 700))
    .confirm('INV-0001', '2026-10-20');

  assert.throws(() => confirmed.confirm('INV-0002', '2026-10-20'), SaleCannotBeModifiedError);
});

test('Sale aggregate - editing items on confirmed sale keeps the same invoice number', () => {
  const confirmed = Sale.create({
    id: 'sale-001',
    salesDayId: 'sd-100',
    customerId: 'cust-50'
  })
    .addItem(createSampleItem('p-1', 2, 1000, 700))
    .confirm('INV-0001', '2026-10-20');

  const modified = confirmed.updateItemQuantity('item-p-1', 5);
  assert.equal(modified.invoiceNumber, 'INV-0001');
  assert.equal(modified.totalQuantity, 5);
  assert.equal(modified.totalAmount, 5000);

  // itemName cannot be changed once confirmed (PDR rule)
  assert.throws(() => modified.updateItemName('item-p-1', 'Otro Nombre'), SaleCannotBeModifiedError);

  // Cannot remove all items from confirmed sale
  assert.throws(() => modified.removeItem('item-p-1'), SaleMustContainItemsError);
});

test('Sale aggregate - rejects any modifications once voided', () => {
  const confirmed = Sale.create({
    id: 'sale-001',
    salesDayId: 'sd-100',
    customerId: 'cust-50'
  })
    .addItem(createSampleItem('p-1', 2, 1000, 700))
    .confirm('INV-0001', '2026-10-20');

  const voided = confirmed.void();

  assert.throws(() => voided.addItem(createSampleItem('p-2')), SaleAlreadyVoidedError);
  assert.throws(() => voided.updateItemQuantity('item-p-1', 5), SaleAlreadyVoidedError);
  assert.throws(() => voided.updateItemName('item-p-1', 'Nuevo Nombre'), SaleAlreadyVoidedError);
  assert.throws(() => voided.removeItem('item-p-1'), SaleAlreadyVoidedError);
});

test('Sale aggregate - voids a confirmed sale logically without modifying items or invoiceNumber', () => {
  const confirmed = Sale.create({
    id: 'sale-001',
    salesDayId: 'sd-100',
    customerId: 'cust-50'
  })
    .addItem(createSampleItem('p-1', 2, 1000, 700))
    .confirm('INV-0001', '2026-10-20');

  const voided = confirmed.void();

  assert.equal(voided.status, 'VOIDED');
  assert.equal(voided.isVoided(), true);
  assert.equal(voided.invoiceNumber, 'INV-0001'); // invoiceNumber is preserved, never reused
  assert.ok(voided.voidedAt);

  // Re-voiding fails
  assert.throws(() => voided.void(), SaleAlreadyVoidedError);
});

test('Sale aggregate - cannot void a sale that is still in DRAFT', () => {
  const draft = Sale.create({
    id: 'sale-001',
    salesDayId: 'sd-100',
    customerId: 'cust-50'
  }).addItem(createSampleItem('p-1', 2, 1000, 700));

  assert.throws(() => draft.void(), SaleCannotBeModifiedError);
});
