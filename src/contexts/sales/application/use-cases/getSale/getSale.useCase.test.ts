import test from 'node:test';
import assert from 'node:assert/strict';
import { GetSaleUseCase } from './getSale.useCase';
import { Sale } from '../../../domain/entities/sale';
import { SaleRepository } from '../../ports/outbound/sale.repository';
import { SaleNotFoundError } from '../../../domain/errors/saleNotFound.error';

test('GetSaleUseCase - returns sale primitives when found', async () => {
  const sale = Sale.create({ id: 'sale-1', salesDayId: 'sd-1', customerId: 'c-1' });
  const repo: SaleRepository = {
    async save() {},
    async findById(id) {
      return id === 'sale-1' ? sale : null;
    },
    async findBySalesDayId() {
      return [];
    },
    async list() {
      return [];
    }
  };

  const useCase = new GetSaleUseCase(repo);
  const result = await useCase.run('sale-1');

  assert.equal(result.isSuccess, true);
  assert.equal(result.value?.id, 'sale-1');
});

test('GetSaleUseCase - fails with SaleNotFoundError when not found', async () => {
  const repo: SaleRepository = {
    async save() {},
    async findById() {
      return null;
    },
    async findBySalesDayId() {
      return [];
    },
    async list() {
      return [];
    }
  };

  const useCase = new GetSaleUseCase(repo);
  const result = await useCase.run('non-existent');

  assert.equal(result.isSuccess, false);
  assert.ok(result.error instanceof SaleNotFoundError);
});
