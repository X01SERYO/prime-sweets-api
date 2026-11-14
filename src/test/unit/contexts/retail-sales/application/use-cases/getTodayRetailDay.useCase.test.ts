import test from 'node:test';
import assert from 'node:assert/strict';
import { GetTodayRetailDayUseCase } from '@/contexts/retail-sales/application/use-cases/getTodayRetailDay/getTodayRetailDay.useCase';
import { RetailDayRepository } from '@/contexts/retail-sales/application/ports/outbound/retailDay.repository';
import { RetailDay } from '@/contexts/retail-sales/domain/entities/retailDay';

const today = '2026-11-14';

function emptyRepo(): RetailDayRepository {
  return {
    async compactBefore() {},
    async findByBusinessDate() {
      return null;
    },
    async insertIfAbsent(day) {
      return day;
    },
    async save() {},
    async saveAll() {},
    async delete() {},
    async listByStatus() {
      return { items: [], total: 0 };
    },
  };
}

test('the first read of today returns an empty editable day and stores nothing', async () => {
  let inserted = false;
  const repo = emptyRepo();
  repo.insertIfAbsent = async () => {
    inserted = true;
    return RetailDay.create('day-1', today);
  };
  const useCase = new GetTodayRetailDayUseCase(repo, { today: () => today });
  const result = await useCase.run();
  assert.equal(result.value?.id, null);
  assert.equal(result.value?.businessDate, today);
  assert.equal(result.value?.editable, true);
  assert.equal(result.value?.items.length, 0);
  assert.equal(inserted, false);
});
