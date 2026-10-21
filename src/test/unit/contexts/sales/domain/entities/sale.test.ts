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

test('Sale aggregate - adding same product accumulates quantity', () => {
  const sale = Sale.create({
    id: 'sale-001',
    salesDayId: 'sd-100',
    customerId: 'cust-50'
  });

  const itemFirst = createSampleItem('p-1', 2, 1000, 700);
  const itemSecond = createSampleItem('p-1', 3, 1000, 700);

  const updated = sale.addItem(itemFirst).addItem(itemSecond);

  assert.equal(updated.items.length, 1);
  assert.equal(updated.totalQuantity, 5);
  assert.equal(updated.totalAmount, 5000);
  assert.equal(updated.totalProfit, 1500);
});

test('Sale aggregate - updates item quantity and custom item name in draft', () => {
  const sale = Sale.create({
    id: 'sale-001',
    salesDayId: 'sd-100',
    customerId: 'cust-50'
  }).addItem(createSampleItem('p-1', 2, 1000, 700));

  const modifiedQty = sale.updateItemQuantity('p-1', 10);
  assert.equal(modifiedQty.totalQuantity, 10);
  assert.equal(modifiedQty.totalAmount, 10000);

  const modifiedName = modifiedQty.updateItemName('p-1', 'Nombre Personalizado de Factura');
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

  const removed = sale.removeItem('p-1');
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

  const confirmed = sale.confirm('INV-0001');

  assert.equal(confirmed.status, 'CONFIRMED');
  assert.equal(confirmed.isConfirmed(), true);
  assert.equal(confirmed.isDraft(), false);
  assert.equal(confirmed.invoiceNumber, 'INV-0001');
  assert.ok(confirmed.confirmedAt);
});

test('Sale aggregate - rejects confirmation if sale has no items', () => {
  const emptySale = Sale.create({
    id: 'sale-001',
    salesDayId: 'sd-100',
    customerId: 'cust-50'
  });

  assert.throws(() => emptySale.confirm('INV-0001'), SaleMustContainItemsError);
});

test('Sale aggregate - rejects confirmation if invoice number is missing or empty', () => {
  const sale = Sale.create({
    id: 'sale-001',
    salesDayId: 'sd-100',
    customerId: 'cust-50'
  }).addItem(createSampleItem('p-1', 2, 1000, 700));

  assert.throws(() => sale.confirm(''), InvalidSaleError);
  assert.throws(() => sale.confirm('   '), InvalidSaleError);
});

test('Sale aggregate - confirms only once', () => {
  const confirmed = Sale.create({
    id: 'sale-001',
    salesDayId: 'sd-100',
    customerId: 'cust-50'
  })
    .addItem(createSampleItem('p-1', 2, 1000, 700))
    .confirm('INV-0001');

  assert.throws(() => confirmed.confirm('INV-0002'), SaleCannotBeModifiedError);
});

test('Sale aggregate - editing items on confirmed sale keeps the same invoice number', () => {
  const confirmed = Sale.create({
    id: 'sale-001',
    salesDayId: 'sd-100',
    customerId: 'cust-50'
  })
    .addItem(createSampleItem('p-1', 2, 1000, 700))
    .confirm('INV-0001');

  const modified = confirmed.updateItemQuantity('p-1', 5);
  assert.equal(modified.invoiceNumber, 'INV-0001');
  assert.equal(modified.totalQuantity, 5);
  assert.equal(modified.totalAmount, 5000);

  // itemName cannot be changed once confirmed (PDR rule)
  assert.throws(() => modified.updateItemName('p-1', 'Otro Nombre'), SaleCannotBeModifiedError);

  // Cannot remove all items from confirmed sale
  assert.throws(() => modified.removeItem('p-1'), SaleMustContainItemsError);
});

test('Sale aggregate - rejects any modifications once voided', () => {
  const confirmed = Sale.create({
    id: 'sale-001',
    salesDayId: 'sd-100',
    customerId: 'cust-50'
  })
    .addItem(createSampleItem('p-1', 2, 1000, 700))
    .confirm('INV-0001');

  const voided = confirmed.void();

  assert.throws(() => voided.addItem(createSampleItem('p-2')), SaleAlreadyVoidedError);
  assert.throws(() => voided.updateItemQuantity('p-1', 5), SaleAlreadyVoidedError);
  assert.throws(() => voided.updateItemName('p-1', 'Nuevo Nombre'), SaleAlreadyVoidedError);
  assert.throws(() => voided.removeItem('p-1'), SaleAlreadyVoidedError);
});

test('Sale aggregate - voids a confirmed sale logically without modifying items or invoiceNumber', () => {
  const confirmed = Sale.create({
    id: 'sale-001',
    salesDayId: 'sd-100',
    customerId: 'cust-50'
  })
    .addItem(createSampleItem('p-1', 2, 1000, 700))
    .confirm('INV-0001');

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
