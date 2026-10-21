import test from 'node:test';
import assert from 'node:assert/strict';
import { SalesDay } from '../../../../../../../contexts/sales-day/domain/entities/salesDay';
import { SalesDayRepository } from '../../../../../../../contexts/sales-day/application/ports/outbound/salesDay.repository';
import { BusinessDateProvider } from '../../../../../../../contexts/sales-day/application/services/businessDate.provider';
import { ReopenCurrentSalesDayUseCase } from '../../../../../../../contexts/sales-day/application/use-cases/reopenCurrentSalesDay/reopenCurrentSalesDay.useCase';
import { SalesDayNotFoundError } from '../../../../../../../contexts/sales-day/domain/errors/salesDayNotFound.error';
import { SalesDayCannotBeReopenedError } from '../../../../../../../contexts/sales-day/domain/errors/salesDayCannotBeReopenedError';
import { SalesDayAlreadyOpenError } from '../../../../../../../contexts/sales-day/domain/errors/salesDayAlreadyOpenError';
import { InvalidSalesDayError } from '../../../../../../../contexts/sales-day/domain/errors/invalidSalesDay.error';

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
    const idx = this.salesDays.findIndex((sd) => sd.id === salesDay.id);
    if (idx >= 0) {
      this.salesDays[idx] = salesDay;
    } else {
      this.salesDays.push(salesDay);
    }
  }
}

class FixedDateProvider implements BusinessDateProvider {
  constructor(public date: string) {}
  getCurrentDate(): string {
    return this.date;
  }
}

test('ReopenCurrentSalesDayUseCase - reopens a closed sales day for the current calendar date', async () => {
  const repository = new InMemorySalesDayRepository();
  const day = SalesDay.create({ id: 'sd-10', sellerId: 'seller-1', date: '2026-10-13' }).close();
  await repository.save(day);

  const dateProvider = new FixedDateProvider('2026-10-13');
  const useCase = new ReopenCurrentSalesDayUseCase(repository, dateProvider);

  const result = await useCase.run({ id: 'sd-10' });

  assert.equal(result.isSuccess, true);
  assert.equal(result.value!.status, 'OPEN');
  assert.equal(result.value!.closedAt, null);

  const inRepo = await repository.findById('sd-10');
  assert.equal(inRepo?.isOpen(), true);
});

test('ReopenCurrentSalesDayUseCase - rejects reopening a historical sales day', async () => {
  const repository = new InMemorySalesDayRepository();
  const day = SalesDay.create({ id: 'sd-10', sellerId: 'seller-1', date: '2026-10-12' }).close();
  await repository.save(day);

  const dateProvider = new FixedDateProvider('2026-10-13');
  const useCase = new ReopenCurrentSalesDayUseCase(repository, dateProvider);

  const result = await useCase.run({ id: 'sd-10' });

  assert.equal(result.isSuccess, false);
  assert.ok(result.error instanceof SalesDayCannotBeReopenedError);
});

test('ReopenCurrentSalesDayUseCase - fails if sales day is already open', async () => {
  const repository = new InMemorySalesDayRepository();
  const day = SalesDay.create({ id: 'sd-10', sellerId: 'seller-1', date: '2026-10-13' });
  await repository.save(day);

  const dateProvider = new FixedDateProvider('2026-10-13');
  const useCase = new ReopenCurrentSalesDayUseCase(repository, dateProvider);

  const result = await useCase.run({ id: 'sd-10' });

  assert.equal(result.isSuccess, false);
  assert.ok(result.error instanceof SalesDayAlreadyOpenError);
});

test('ReopenCurrentSalesDayUseCase - fails if sales day does not exist', async () => {
  const repository = new InMemorySalesDayRepository();
  const dateProvider = new FixedDateProvider('2026-10-13');
  const useCase = new ReopenCurrentSalesDayUseCase(repository, dateProvider);

  const result = await useCase.run({ id: 'not-found' });

  assert.equal(result.isSuccess, false);
  assert.ok(result.error instanceof SalesDayNotFoundError);
});
