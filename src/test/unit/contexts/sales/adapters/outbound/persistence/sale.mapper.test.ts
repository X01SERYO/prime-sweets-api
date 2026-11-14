import test from 'node:test';
import assert from 'node:assert/strict';
import { Sale } from '@/contexts/sales/domain/entities/sale';
import { SaleItem } from '@/contexts/sales/domain/entities/saleItem';
import { SaleMapper } from '@/contexts/sales/adapters/outbound/persistence/sale.mapper';
import { InvalidSaleError } from '@/contexts/sales/domain/errors/invalidSale.error';

test('SaleMapper round-trips a confirmed sale and rejects an unknown status', () => {
  const sale = Sale.create({
    id: 's-1',
    sellerId: 'seller-1',
    captureDate: '2026-11-14',
    customerId: 'c-1',
    deliveryDate: '2026-11-14'
  })
    .addItem(
      SaleItem.create({
        id: 'i-1',
        productId: 'p-1',
        itemName: 'Soda',
        quantity: 2,
        wholesalePrice: 1000,
        wholesaleCost: 600
      })
    )
    .confirm('001', '2026-11-14');

  const entity = SaleMapper.toEntity(sale);
  entity.captureDate = '2026-11-14';
  entity.deliveryDate = '2026-11-14';
  const restored = SaleMapper.toDomain(entity);

  assert.equal(restored.id, 's-1');
  assert.equal(restored.status, 'CONFIRMED');
  assert.equal(restored.items.length, 1);
  assert.equal(restored.invoiceNumber, '001');

  entity.status = 'OTHER';
  assert.throws(() => SaleMapper.toDomain(entity), InvalidSaleError);
});
