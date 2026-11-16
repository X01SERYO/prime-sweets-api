import test from 'node:test';
import assert from 'node:assert/strict';
import { GetRetailDayUseCase } from '@/contexts/retail-sales/application/use-cases/getRetailDay/getRetailDay.useCase';
import { RetailDayRepository } from '@/contexts/retail-sales/application/ports/outbound/retailDay.repository';
import { RetailDay, RetailDayStatus } from '@/contexts/retail-sales/domain/entities/retailDay';
import { InvalidRetailDateError } from '@/contexts/retail-sales/domain/errors/invalidRetailDate.error';
import { RetailDayNotFoundError } from '@/contexts/retail-sales/domain/errors/retailDayNotFound.error';

const chocolate = {
  productId: 'prod-1',
  productCode: 'A12',
  brandName: 'Jet',
  productName: 'Chocolatina',
  retailPrice: 1500,
  retailCost: 1000,
};

class MemoryRetailDays implements RetailDayRepository {
  rows = new Map<string, RetailDay>();

  async compactBefore(today: string): Promise<void> {
    for (const [date, day] of this.rows) {
      if (date < today) this.rows.set(date, day.compact());
    }
  }

  async findByBusinessDate(businessDate: string): Promise<RetailDay | null> {
    return this.rows.get(businessDate) ?? null;
  }

  async insertIfAbsent(day: RetailDay): Promise<RetailDay> {
    return day;
  }

  async save(day: RetailDay): Promise<void> {
    this.rows.set(day.businessDate, day);
  }

  async saveAll(days: RetailDay[]): Promise<void> {
    for (const day of days) await this.save(day);
  }

  async delete(): Promise<void> {}

  async listByStatus() {
    return { items: [], total: 0 };
  }
}

function useCase(days: RetailDayRepository) {
  return new GetRetailDayUseCase(days, { findNames: async () => new Map([['user-1', 'Ana']]) }, { today: () => '2026-11-14' });
}

test('a past day returns a summary without lines and keeps its totals', async () => {
  const days = new MemoryRetailDays();
  const reviewed = RetailDay.create('day-1', '2026-11-13')
    .addProduct(chocolate, 2, '2026-11-13')
    .review('user-1', new Date('2026-11-14T18:00:00.000Z'));
  days.rows.set('2026-11-13', reviewed);

  const result = await useCase(days).run('2026-11-13');

  assert.equal(result.isSuccess, true);
  assert.equal(result.value?.editable, false);
  assert.equal(result.value?.status, RetailDayStatus.Reviewed);
  assert.deepEqual(result.value?.items, []);
  assert.equal(result.value?.totalAmount, 3000);
  assert.equal(result.value?.reviewedByName, 'Ana');
  assert.equal(days.rows.get('2026-11-13')?.items.length, 0);
});

test('a missing day and a future or invalid date are rejected', async () => {
  const days = new MemoryRetailDays();
  const missing = await useCase(days).run('2026-11-01');
  const future = await useCase(days).run('2026-11-15');
  const invalid = await useCase(days).run('2026-02-31');

  assert.equal(missing.error instanceof RetailDayNotFoundError, true);
  assert.equal(future.error instanceof InvalidRetailDateError, true);
  assert.equal(invalid.error instanceof InvalidRetailDateError, true);
});
