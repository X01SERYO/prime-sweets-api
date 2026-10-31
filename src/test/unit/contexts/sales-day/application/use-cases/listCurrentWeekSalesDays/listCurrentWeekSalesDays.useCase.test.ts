import test from 'node:test';
import assert from 'node:assert/strict';
import { SalesDay } from '../../../../../../../contexts/sales-day/domain/entities/salesDay';
import { SalesDayRepository } from '../../../../../../../contexts/sales-day/application/ports/outbound/salesDay.repository';
import { BusinessDateProvider } from '../../../../../../../contexts/sales-day/application/services/businessDate.provider';
import { ListCurrentWeekSalesDaysUseCase } from '../../../../../../../contexts/sales-day/application/use-cases/listCurrentWeekSalesDays/listCurrentWeekSalesDays.useCase';
import { InvalidSalesDayError } from '../../../../../../../contexts/sales-day/domain/errors/invalidSalesDay.error';
import { currentWeekBounds, isInsideEditWindow } from '../../../../../../../contexts/sales-day/domain/currentWeek';

class InMemorySalesDayRepository implements SalesDayRepository {
  public salesDays: SalesDay[] = [];

  async findById(id: string): Promise<SalesDay | null> {
    return this.salesDays.find(day => day.id === id) ?? null;
  }

  async findBySellerAndDate(sellerId: string, date: string): Promise<SalesDay | null> {
    return this.salesDays.find(day => day.sellerId === sellerId && day.date === date) ?? null;
  }

  async findBySellerBetween(sellerId: string, fromDate: string, toDate: string): Promise<SalesDay[]> {
    return this.salesDays.filter(day => day.sellerId === sellerId && day.date >= fromDate && day.date <= toDate);
  }

  async findActiveBySeller(sellerId: string): Promise<SalesDay | null> {
    return this.salesDays.find(day => day.sellerId === sellerId && day.isOpen()) ?? null;
  }

  async save(salesDay: SalesDay): Promise<void> {
    this.salesDays.push(salesDay);
  }
}

class FixedDateProvider implements BusinessDateProvider {
  constructor(public date: string) {}

  getCurrentDate(): string {
    return this.date;
  }
}

test('currentWeekBounds - Monday excludes the previous Sunday and Sunday includes that Monday', () => {
  assert.deepEqual(currentWeekBounds('2026-10-26'), { weekStart: '2026-10-26', through: '2026-10-26' });
  assert.equal(isInsideEditWindow('2026-10-25', '2026-10-26'), false);
  assert.deepEqual(currentWeekBounds('2026-11-01'), { weekStart: '2026-10-26', through: '2026-11-01' });
  assert.equal(isInsideEditWindow('2026-10-26', '2026-11-01'), true);
});

test('ListCurrentWeekSalesDaysUseCase - returns this week through today, newest first', async () => {
  const repository = new InMemorySalesDayRepository();
  await repository.save(SalesDay.create({ id: 'previous-sunday', sellerId: 'seller-1', date: '2026-10-25', status: 'CLOSED' }));
  await repository.save(SalesDay.create({ id: 'monday', sellerId: 'seller-1', date: '2026-10-26', status: 'CLOSED' }));
  await repository.save(SalesDay.create({ id: 'saturday', sellerId: 'seller-1', date: '2026-10-31', status: 'OPEN' }));
  await repository.save(SalesDay.create({ id: 'next-sunday', sellerId: 'seller-1', date: '2026-11-01', status: 'CLOSED' }));
  await repository.save(SalesDay.create({ id: 'other-seller', sellerId: 'seller-2', date: '2026-10-31', status: 'CLOSED' }));

  const useCase = new ListCurrentWeekSalesDaysUseCase(repository, new FixedDateProvider('2026-10-31'));
  const result = await useCase.run({ sellerId: 'seller-1' });

  assert.equal(result.isSuccess, true);
  assert.deepEqual(
    result.value!.map(day => day.id),
    ['saturday', 'monday']
  );
});

test('ListCurrentWeekSalesDaysUseCase - returns an empty list when the seller has no days this week', async () => {
  const repository = new InMemorySalesDayRepository();
  const useCase = new ListCurrentWeekSalesDaysUseCase(repository, new FixedDateProvider('2026-10-31'));

  const result = await useCase.run({ sellerId: 'seller-1' });

  assert.equal(result.isSuccess, true);
  assert.deepEqual(result.value, []);
});

test('ListCurrentWeekSalesDaysUseCase - fails on invalid sellerId', async () => {
  const repository = new InMemorySalesDayRepository();
  const useCase = new ListCurrentWeekSalesDaysUseCase(repository, new FixedDateProvider('2026-10-31'));

  const result = await useCase.run({ sellerId: ' ' });

  assert.equal(result.isSuccess, false);
  assert.ok(result.error instanceof InvalidSalesDayError);
});
