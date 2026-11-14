import test from 'node:test';
import assert from 'node:assert/strict';
import { ListRetailDaysUseCase } from '@/contexts/retail-sales/application/use-cases/listRetailDays/listRetailDays.useCase';
import { ReviewRetailDaysUseCase } from '@/contexts/retail-sales/application/use-cases/reviewRetailDays/reviewRetailDays.useCase';
import { RetailDayRepository } from '@/contexts/retail-sales/application/ports/outbound/retailDay.repository';
import { RetailDay, RetailDayStatus } from '@/contexts/retail-sales/domain/entities/retailDay';
import { RetailDayAlreadyReviewedError } from '@/contexts/retail-sales/domain/errors/retailDayAlreadyReviewed.error';
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
    return this.rows.get(day.businessDate) ?? day;
  }

  async save(day: RetailDay): Promise<void> {
    this.rows.set(day.businessDate, day);
  }

  async saveAll(days: RetailDay[]): Promise<void> {
    for (const day of days) await this.save(day);
  }

  async delete(): Promise<void> {}

  async listByStatus(status: RetailDayStatus, page: number, pageSize: number) {
    const items = [...this.rows.values()]
      .filter((day) => day.status === status)
      .sort((left, right) => right.businessDate.localeCompare(left.businessDate));
    const start = (page - 1) * pageSize;
    return { items: items.slice(start, start + pageSize), total: items.length };
  }
}

function day(date: string, quantity: number): RetailDay {
  return RetailDay.create(date, date).addProduct(chocolate, quantity, date);
}

test('list returns unreviewed days newest first and resolves the reviewer name', async () => {
  const days = new MemoryRetailDays();
  days.rows.set('2026-11-13', day('2026-11-13', 2));
  days.rows.set('2026-11-14', day('2026-11-14', 1));
  const reviewed = day('2026-11-12', 1).review('user-1', new Date('2026-11-14T18:00:00.000Z'));
  days.rows.set('2026-11-12', reviewed);

  const useCase = new ListRetailDaysUseCase(
    days,
    { findNames: async () => new Map([['user-1', 'Ana']]) },
    { today: () => '2026-11-14' }
  );
  const open = await useCase.run({ status: RetailDayStatus.Unreviewed, page: 1, pageSize: 10 });
  assert.equal(open.value?.total, 2);
  assert.deepEqual(
    open.value?.items.map((item) => item.businessDate),
    ['2026-11-14', '2026-11-13']
  );

  const closed = await useCase.run({ status: RetailDayStatus.Reviewed });
  assert.equal(closed.value?.items[0].reviewedByName, 'Ana');
  assert.equal(closed.value?.pageSize, 10);
});

test('review marks every selected day or none', async () => {
  const days = new MemoryRetailDays();
  days.rows.set('2026-11-13', day('2026-11-13', 2));
  days.rows.set('2026-11-12', day('2026-11-12', 1));
  const useCase = new ReviewRetailDaysUseCase(days, { today: () => '2026-11-14' });

  const missing = await useCase.run({ dates: ['2026-11-13', '2026-11-01'], reviewerId: 'user-1' });
  assert.equal(missing.error instanceof RetailDayNotFoundError, true);
  assert.equal(days.rows.get('2026-11-13')?.status, RetailDayStatus.Unreviewed);

  const ok = await useCase.run({ dates: ['2026-11-13', '2026-11-12'], reviewerId: 'user-1' });
  assert.equal(ok.value?.reviewed, 2);
  assert.equal(ok.value?.totalAmount, 4500);
  assert.equal(days.rows.get('2026-11-13')?.items.length, 0);
  assert.equal(days.rows.get('2026-11-12')?.reviewedBy, 'user-1');

  const again = await useCase.run({ dates: ['2026-11-13', '2026-11-12'], reviewerId: 'user-2' });
  assert.equal(again.error instanceof RetailDayAlreadyReviewedError, true);
  assert.deepEqual((again.error as RetailDayAlreadyReviewedError).dates, ['2026-11-13', '2026-11-12']);
});
