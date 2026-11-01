import test from 'node:test';
import assert from 'node:assert/strict';
import { VoidSaleUseCase } from '../../../../../../../contexts/sales/application/use-cases/voidSale/voidSale.useCase';
import { Sale } from '../../../../../../../contexts/sales/domain/entities/sale';
import { SaleItem } from '../../../../../../../contexts/sales/domain/entities/saleItem';
import { SaleRepository } from '../../../../../../../contexts/sales/application/ports/outbound/sale.repository';
import { SaleAlreadyVoidedError } from '../../../../../../../contexts/sales/domain/errors/saleAlreadyVoided.error';

function item(): SaleItem {
  return SaleItem.create({
    id: 'it-1',
    productId: 'p-1',
    itemName: 'Item 1',
    quantity: 2,
    wholesalePrice: 1000,
    wholesaleCost: 600
  });
}

function draft(): Sale {
  return Sale.create({ id: 's-1', sellerId: 'seller-1', captureDate: '2026-11-04', customerId: 'c-1', deliveryDate: '2026-11-05' });
}

function repoWith(sale: Sale): SaleRepository {
  let saved: Sale = sale;
  return {
    async save(s) {
      saved = s;
    },
    async findById() {
      return saved;
    },
    async list() {
      return [];
    }
  };
}

test('VoidSaleUseCase - voids confirmed sale preserving invoice number', async () => {
  const confirmed = draft().addItem(item()).confirm('INV-0001', '2026-11-04');

  const useCase = new VoidSaleUseCase(repoWith(confirmed));
  const result = await useCase.run({ saleId: 's-1' });

  assert.equal(result.isSuccess, true);
  assert.equal(result.value?.status, 'VOIDED');
  assert.equal(result.value?.invoiceNumber, 'INV-0001');
  assert.ok(result.value?.voidedAt);
});

test('VoidSaleUseCase - voids a draft sale without an invoice number', async () => {
  const useCase = new VoidSaleUseCase(repoWith(draft().addItem(item())));
  const result = await useCase.run({ saleId: 's-1' });

  assert.equal(result.isSuccess, true);
  assert.equal(result.value?.status, 'VOIDED');
  assert.equal(result.value?.invoiceNumber, null);
  assert.ok(result.value?.voidedAt);
});

test('VoidSaleUseCase - fails if already voided', async () => {
  const voided = draft().addItem(item()).confirm('INV-0001', '2026-11-04').void();

  const useCase = new VoidSaleUseCase(repoWith(voided));
  const result = await useCase.run({ saleId: 's-1' });

  assert.equal(result.isSuccess, false);
  assert.ok(result.error instanceof SaleAlreadyVoidedError);
});
