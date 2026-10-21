import test from 'node:test';
import assert from 'node:assert/strict';
import { SalesDay } from '../../../../../../../contexts/sales-day/domain/entities/salesDay';
import { SalesDayRepository } from '../../../../../../../contexts/sales-day/application/ports/outbound/salesDay.repository';
import { CloseSalesDayUseCase } from '../../../../../../../contexts/sales-day/application/use-cases/closeSalesDay/closeSalesDay.useCase';
import { SalesDayNotFoundError } from '../../../../../../../contexts/sales-day/domain/errors/salesDayNotFound.error';
import { SalesDayAlreadyClosedError } from '../../../../../../../contexts/sales-day/domain/errors/salesDayAlreadyClosedError';
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

test('CloseSalesDayUseCase - closes an open sales day successfully', async () => {
  const repository = new InMemorySalesDayRepository();
  await repository.save(SalesDay.create({ id: 'sd-10', sellerId: 'seller-1', date: '2026-10-13' }));

  const useCase = new CloseSalesDayUseCase(repository);
  const result = await useCase.run({ id: 'sd-10' });

  assert.equal(result.isSuccess, true);
  assert.equal(result.value!.status, 'CLOSED');
  assert.ok(result.value!.closedAt);

  const inRepo = await repository.findById('sd-10');
  assert.equal(inRepo?.isClosed(), true);
});

test('CloseSalesDayUseCase - fails if sales day is already closed', async () => {
  const repository = new InMemorySalesDayRepository();
  const day = SalesDay.create({ id: 'sd-10', sellerId: 'seller-1', date: '2026-10-13' }).close();
  await repository.save(day);

  const useCase = new CloseSalesDayUseCase(repository);
  const result = await useCase.run({ id: 'sd-10' });

  assert.equal(result.isSuccess, false);
  assert.ok(result.error instanceof SalesDayAlreadyClosedError);
});

test('CloseSalesDayUseCase - fails if sales day is not found', async () => {
  const repository = new InMemorySalesDayRepository();
  const useCase = new CloseSalesDayUseCase(repository);
  const result = await useCase.run({ id: 'non-existent' });

  assert.equal(result.isSuccess, false);
  assert.ok(result.error instanceof SalesDayNotFoundError);
});
