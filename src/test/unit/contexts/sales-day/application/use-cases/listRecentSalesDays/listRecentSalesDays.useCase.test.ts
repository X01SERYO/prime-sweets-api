import test from 'node:test';
import assert from 'node:assert/strict';
import { SalesDay } from '../../../../../../../contexts/sales-day/domain/entities/salesDay';
import { SalesDayRepository } from '../../../../../../../contexts/sales-day/application/ports/outbound/salesDay.repository';
import { BusinessDateProvider } from '../../../../../../../contexts/sales-day/application/services/businessDate.provider';
import { ListRecentSalesDaysUseCase } from '../../../../../../../contexts/sales-day/application/use-cases/listRecentSalesDays/listRecentSalesDays.useCase';
import { InvalidSalesDayError } from '../../../../../../../contexts/sales-day/domain/errors/invalidSalesDay.error';

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

test('ListRecentSalesDaysUseCase - returns the last 7 days newest first and skips older days', async () => {
  const repository = new InMemorySalesDayRepository();
  await repository.save(SalesDay.create({ id: 'old', sellerId: 'seller-1', date: '2026-10-23', status: 'CLOSED' }));
  await repository.save(SalesDay.create({ id: 'edge', sellerId: 'seller-1', date: '2026-10-24', status: 'CLOSED' }));
  await repository.save(SalesDay.create({ id: 'today', sellerId: 'seller-1', date: '2026-10-30', status: 'OPEN' }));
  await repository.save(SalesDay.create({ id: 'other', sellerId: 'seller-2', date: '2026-10-30', status: 'CLOSED' }));

  const useCase = new ListRecentSalesDaysUseCase(repository, new FixedDateProvider('2026-10-30'));
  const result = await useCase.run({ sellerId: 'seller-1' });

  assert.equal(result.isSuccess, true);
  assert.deepEqual(
    result.value!.map(day => day.id),
    ['today', 'edge']
  );
});

test('ListRecentSalesDaysUseCase - crosses the month boundary', async () => {
  const repository = new InMemorySalesDayRepository();
  await repository.save(SalesDay.create({ id: 'before', sellerId: 'seller-1', date: '2026-02-22', status: 'CLOSED' }));
  await repository.save(SalesDay.create({ id: 'start', sellerId: 'seller-1', date: '2026-02-23', status: 'CLOSED' }));

  const useCase = new ListRecentSalesDaysUseCase(repository, new FixedDateProvider('2026-03-01'));
  const result = await useCase.run({ sellerId: 'seller-1' });

  assert.equal(result.isSuccess, true);
  assert.deepEqual(
    result.value!.map(day => day.id),
    ['start']
  );
});

test('ListRecentSalesDaysUseCase - returns an empty list when the seller has no recent days', async () => {
  const repository = new InMemorySalesDayRepository();
  const useCase = new ListRecentSalesDaysUseCase(repository, new FixedDateProvider('2026-10-30'));

  const result = await useCase.run({ sellerId: 'seller-1' });

  assert.equal(result.isSuccess, true);
  assert.deepEqual(result.value, []);
});

test('ListRecentSalesDaysUseCase - fails on invalid sellerId', async () => {
  const repository = new InMemorySalesDayRepository();
  const useCase = new ListRecentSalesDaysUseCase(repository, new FixedDateProvider('2026-10-30'));

  const result = await useCase.run({ sellerId: ' ' });

  assert.equal(result.isSuccess, false);
  assert.ok(result.error instanceof InvalidSalesDayError);
});
