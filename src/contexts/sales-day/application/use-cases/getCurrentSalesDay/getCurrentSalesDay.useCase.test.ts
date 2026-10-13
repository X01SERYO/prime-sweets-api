import test from 'node:test';
import assert from 'node:assert/strict';
import { SalesDay } from '../../../domain/entities/salesDay';
import { SalesDayRepository } from '../../ports/outbound/salesDay.repository';
import { BusinessDateProvider } from '../../services/businessDate.provider';
import { GetCurrentSalesDayUseCase } from './getCurrentSalesDay.useCase';
import { SalesDayNotFoundError } from '../../../domain/errors/salesDayNotFound.error';
import { InvalidSalesDayError } from '../../../domain/errors/invalidSalesDay.error';

class InMemorySalesDayRepository implements SalesDayRepository {
  public salesDays: SalesDay[] = [];

  async findById(id: string): Promise<SalesDay | null> {
    return this.salesDays.find((sd) => sd.id === id) ?? null;
  }

  async findBySellerAndDate(sellerId: string, date: string): Promise<SalesDay | null> {
    return this.salesDays.find((sd) => sd.sellerId === sellerId && sd.date === date) ?? null;
  }

  async findActiveBySeller(sellerId: string): Promise<SalesDay | null> {
    return this.salesDays.find((sd) => sd.sellerId === sellerId && sd.isOpen()) ?? null;
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

test('GetCurrentSalesDayUseCase - returns sales day when found for current date', async () => {
  const repository = new InMemorySalesDayRepository();
  await repository.save(SalesDay.create({ id: 'sd-10', sellerId: 'seller-5', date: '2026-10-13' }));

  const dateProvider = new FixedDateProvider('2026-10-13');
  const useCase = new GetCurrentSalesDayUseCase(repository, dateProvider);

  const result = await useCase.run({ sellerId: 'seller-5' });

  assert.equal(result.isSuccess, true);
  assert.equal(result.value!.id, 'sd-10');
  assert.equal(result.value!.sellerId, 'seller-5');
});

test('GetCurrentSalesDayUseCase - returns SalesDayNotFoundError when not found', async () => {
  const repository = new InMemorySalesDayRepository();
  const dateProvider = new FixedDateProvider('2026-10-13');
  const useCase = new GetCurrentSalesDayUseCase(repository, dateProvider);

  const result = await useCase.run({ sellerId: 'seller-99' });

  assert.equal(result.isSuccess, false);
  assert.ok(result.error instanceof SalesDayNotFoundError);
});

test('GetCurrentSalesDayUseCase - fails on invalid sellerId', async () => {
  const repository = new InMemorySalesDayRepository();
  const dateProvider = new FixedDateProvider('2026-10-13');
  const useCase = new GetCurrentSalesDayUseCase(repository, dateProvider);

  const result = await useCase.run({ sellerId: '' });

  assert.equal(result.isSuccess, false);
  assert.ok(result.error instanceof InvalidSalesDayError);
});
