import test from 'node:test';
import assert from 'node:assert/strict';
import { ListSalesUseCase } from '../../../../../../../contexts/sales/application/use-cases/listSales/listSales.useCase';
import { Sale } from '../../../../../../../contexts/sales/domain/entities/sale';
import { SaleRepository } from '../../../../../../../contexts/sales/application/ports/outbound/sale.repository';

test('ListSalesUseCase - returns list of sales primitives', async () => {
  const sale1 = Sale.create({ id: 's-1', salesDayId: 'sd-1', customerId: 'c-1' });
  const sale2 = Sale.create({ id: 's-2', salesDayId: 'sd-1', customerId: 'c-2' });

  const repo: SaleRepository = {
    async save() {},
    async findById() {
      return null;
    },
    async findBySalesDayId() {
      return [];
    },
    async list(filters) {
      if (filters?.customerId === 'c-1') {
        return [sale1];
      }
      return [sale1, sale2];
    }
  };

  const useCase = new ListSalesUseCase(repo);
  const resultAll = await useCase.run();

  assert.equal(resultAll.isSuccess, true);
  assert.equal(resultAll.value?.length, 2);

  const resultFiltered = await useCase.run({ customerId: 'c-1' });
  assert.equal(resultFiltered.isSuccess, true);
  assert.equal(resultFiltered.value?.length, 1);
  assert.equal(resultFiltered.value?.[0].customerId, 'c-1');
});
