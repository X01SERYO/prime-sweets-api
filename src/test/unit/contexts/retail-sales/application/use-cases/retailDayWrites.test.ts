import test from 'node:test';
import assert from 'node:assert/strict';
import { AddRetailItemUseCase } from '@/contexts/retail-sales/application/use-cases/addRetailItem/addRetailItem.useCase';
import { SetRetailItemQuantityUseCase } from '@/contexts/retail-sales/application/use-cases/setRetailItemQuantity/setRetailItemQuantity.useCase';
import { RemoveRetailItemUseCase } from '@/contexts/retail-sales/application/use-cases/removeRetailItem/removeRetailItem.useCase';
import { RetailDayRepository } from '@/contexts/retail-sales/application/ports/outbound/retailDay.repository';
import { BusinessCalendar } from '@/shared/application/ports/businessCalendar';
import { RetailProductSnapshotProvider } from '@/contexts/retail-sales/application/ports/outbound/retailProductSnapshotProvider.port';
import { RetailDay } from '@/contexts/retail-sales/domain/entities/retailDay';
import { RetailProductSnapshot } from '@/contexts/retail-sales/domain/entities/retailDayItem';
import { ProductNotFoundForRetailError } from '@/contexts/retail-sales/domain/errors/productNotFoundForRetail.error';
import { ProductWithoutRetailPriceError } from '@/contexts/retail-sales/domain/errors/productWithoutRetailPrice.error';
import { RetailDayClosedError } from '@/contexts/retail-sales/domain/errors/retailDayClosed.error';

const today = '2026-11-14';
const calendar: BusinessCalendar = { today: () => today };

const chocolate: RetailProductSnapshot = {
  productId: 'prod-1',
  productCode: 'A12',
  brandName: 'Jet',
  productName: 'Chocolatina',
  retailPrice: 1500,
  retailCost: 1000,
};

class MemoryRetailDays implements RetailDayRepository {
  rows = new Map<string, RetailDay>();
  deleted: string[] = [];

  async compactBefore(current: string): Promise<void> {
    for (const [date, day] of this.rows) {
      if (date < current) {
        this.rows.set(date, day.compact());
      }
    }
  }

  async findByBusinessDate(businessDate: string): Promise<RetailDay | null> {
    return this.rows.get(businessDate) ?? null;
  }

  async insertIfAbsent(day: RetailDay): Promise<RetailDay> {
    const current = this.rows.get(day.businessDate);
    if (current) {
      return current;
    }
    this.rows.set(day.businessDate, day);
    return day;
  }

  async save(day: RetailDay): Promise<void> {
    this.rows.set(day.businessDate, day);
  }

  async delete(id: string): Promise<void> {
    this.deleted.push(id);
    for (const [date, day] of this.rows) {
      if (day.id === id) {
        this.rows.delete(date);
      }
    }
  }
}

function snapshots(catalog: RetailProductSnapshot[]): RetailProductSnapshotProvider {
  return {
    async getSnapshot(productId: string) {
      return catalog.find((item) => item.productId === productId) ?? null;
    },
  };
}

test('adding a product creates the day and hides the retail cost', async () => {
  const days = new MemoryRetailDays();
  const useCase = new AddRetailItemUseCase(days, snapshots([chocolate]), calendar, { next: () => 'day-1' });
  const result = await useCase.run({ productId: 'prod-1', quantity: 3 });

  assert.equal(result.isSuccess, true);
  assert.equal(result.value?.items[0].quantity, 3);
  assert.equal(result.value?.totalAmount, 4500);
  assert.equal('retailCost' in (result.value?.items[0] ?? {}), false);
  assert.equal(days.rows.get(today)?.items.length, 1);
});

test('adding the same product keeps the frozen price', async () => {
  const days = new MemoryRetailDays();
  const useCase = new AddRetailItemUseCase(days, snapshots([chocolate]), calendar, { next: () => 'day-1' });
  await useCase.run({ productId: 'prod-1', quantity: 3 });
  const changed = snapshots([{ ...chocolate, retailPrice: 9000 }]);
  const again = new AddRetailItemUseCase(days, changed, calendar, { next: () => 'day-2' });
  const result = await again.run({ productId: 'prod-1', quantity: 2 });

  assert.equal(result.value?.items.length, 1);
  assert.equal(result.value?.items[0].quantity, 5);
  assert.equal(result.value?.items[0].retailPrice, 1500);
});

test('a missing product and a product without retail price are rejected without storing a day', async () => {
  const days = new MemoryRetailDays();
  const useCase = new AddRetailItemUseCase(
    days,
    snapshots([{ ...chocolate, productId: 'prod-0', retailPrice: 0 }]),
    calendar,
    { next: () => 'day-1' }
  );

  const missing = await useCase.run({ productId: 'missing', quantity: 1 });
  assert.equal(missing.error instanceof ProductNotFoundForRetailError, true);

  const noPrice = await useCase.run({ productId: 'prod-0', quantity: 1 });
  assert.equal(noPrice.error instanceof ProductWithoutRetailPriceError, true);
  assert.equal(days.rows.size, 0);
});

test('a reviewed today rejects new items', async () => {
  const days = new MemoryRetailDays();
  const reviewed = RetailDay.create('day-1', today)
    .addProduct(chocolate, 1, today)
    .review('user-1', new Date('2026-11-14T18:00:00.000Z'));
  days.rows.set(today, reviewed);
  const useCase = new AddRetailItemUseCase(days, snapshots([chocolate]), calendar, { next: () => 'day-2' });
  const result = await useCase.run({ productId: 'prod-1', quantity: 1 });
  assert.equal(result.error instanceof RetailDayClosedError, true);
});

test('setQuantity updates totals and removing the last product deletes the day', async () => {
  const days = new MemoryRetailDays();
  const add = new AddRetailItemUseCase(days, snapshots([chocolate]), calendar, { next: () => 'day-1' });
  await add.run({ productId: 'prod-1', quantity: 2 });

  const set = new SetRetailItemQuantityUseCase(days, calendar);
  const updated = await set.run({ productId: 'prod-1', quantity: 4 });
  assert.equal(updated.value?.totalAmount, 6000);

  const remove = new RemoveRetailItemUseCase(days, calendar);
  const emptied = await remove.run('prod-1');
  assert.equal(emptied.value?.items.length, 0);
  assert.equal(emptied.value?.totalAmount, 0);
  assert.equal(days.rows.has(today), false);
  assert.deepEqual(days.deleted, ['day-1']);
});
