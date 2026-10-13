import test from 'node:test';
import assert from 'node:assert/strict';
import { InvoiceDocument, SIMPLIFIED_TAX_REGIME } from './invoiceDocument';

const company = {
  name: 'Configured Company',
  nit: '900',
  city: 'Cali',
  country: 'Colombia',
  telephone: '300',
  logo: 'logo-ref',
  legalText: 'Configured legal text'
};

const customer = {
  documentType: 'CC',
  documentNumber: '123',
  name: 'Ada'
};

test('InvoiceDocument - renders the transaction-time item name and keeps the invoice number', () => {
  const first = InvoiceDocument.compose({
    company,
    customer,
    invoiceNumber: 'INV-00007',
    saleDate: '2026-10-13T15:00:00.000Z',
    lines: [
      { productId: 'p-1', itemName: 'Green Soda', quantity: 2, unitValue: 1000, totalValue: 2000 },
      { productId: 'p-1', itemName: 'Red Soda', quantity: 1, unitValue: 1000, totalValue: 1000 }
    ]
  });
  const second = InvoiceDocument.compose({
    company,
    customer,
    invoiceNumber: 'INV-00007',
    saleDate: '2026-10-13T15:00:00.000Z',
    lines: [
      { productId: 'p-1', itemName: 'Green Soda', quantity: 2, unitValue: 1000, totalValue: 2000 },
      { productId: 'p-1', itemName: 'Red Soda', quantity: 1, unitValue: 1000, totalValue: 1000 }
    ]
  });

  const document = first.toPrimitives();

  assert.deepEqual(second.toPrimitives(), document);
  assert.equal(document.invoiceNumber, 'INV-00007');
  assert.equal(document.taxRegime, SIMPLIFIED_TAX_REGIME);
  assert.deepEqual(
    document.lines.map(line => line.productName),
    ['Green Soda', 'Red Soda']
  );
  assert.equal(document.lines[0].productId, 'p-1');
  assert.equal(document.subtotal, 3000);
  assert.equal(document.total, 3000);
  assert.equal(document.legalText, 'Configured legal text');
});
