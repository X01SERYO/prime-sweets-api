import test from 'node:test';
import assert from 'node:assert/strict';
import { SalesDay } from '../../../../../../../contexts/sales-day/domain/entities/salesDay';
import { SalesDayRepository } from '../../../../../../../contexts/sales-day/application/ports/outbound/salesDay.repository';
import { BusinessDateProvider } from '../../../../../../../contexts/sales-day/application/services/businessDate.provider';
import { OpenCurrentSalesDayUseCase } from '../../../../../../../contexts/sales-day/application/use-cases/openCurrentSalesDay/openCurrentSalesDay.useCase';
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

test('OpenCurrentSalesDayUseCase - opens a new sales day for seller and default business date', async () => {
  const repository = new InMemorySalesDayRepository();
  const dateProvider = new FixedDateProvider('2026-10-13');
  const useCase = new OpenCurrentSalesDayUseCase(repository, dateProvider);

  const result = await useCase.run({ sellerId: 'seller-1' });

  assert.equal(result.isSuccess, true);
  assert.equal(result.value!.sellerId, 'seller-1');
  assert.equal(result.value!.date, '2026-10-13');
  assert.equal(result.value!.status, 'OPEN');

  const inRepo = await repository.findBySellerAndDate('seller-1', '2026-10-13');
  assert.ok(inRepo);
  assert.equal(inRepo.isOpen(), true);
});

test('OpenCurrentSalesDayUseCase - fails if sales day for seller and date is already open', async () => {
  const repository = new InMemorySalesDayRepository();
  const dateProvider = new FixedDateProvider('2026-10-13');
  await repository.save(SalesDay.create({ id: 'sd-1', sellerId: 'seller-1', date: '2026-10-13' }));

  const useCase = new OpenCurrentSalesDayUseCase(repository, dateProvider);
  const result = await useCase.run({ sellerId: 'seller-1' });

  assert.equal(result.isSuccess, false);
  assert.ok(result.error instanceof SalesDayAlreadyOpenError);
});

test('OpenCurrentSalesDayUseCase - fails on empty sellerId', async () => {
  const repository = new InMemorySalesDayRepository();
  const dateProvider = new FixedDateProvider('2026-10-13');
  const useCase = new OpenCurrentSalesDayUseCase(repository, dateProvider);

  const result = await useCase.run({ sellerId: '   ' });

  assert.equal(result.isSuccess, false);
  assert.ok(result.error instanceof InvalidSalesDayError);
});
