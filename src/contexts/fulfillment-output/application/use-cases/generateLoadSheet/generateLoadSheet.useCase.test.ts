import test from 'node:test';
import assert from 'node:assert/strict';
import { GenerateLoadSheetUseCase } from './generateLoadSheet.useCase';
import { SalesDayClosureQuery } from '../../ports/outbound/salesDayClosureQuery.port';
import { ConfirmedSaleItemsQuery } from '../../ports/outbound/confirmedSaleItemsQuery.port';
import { CatalogProductDisplayQuery } from '../../ports/outbound/catalogProductDisplayQuery.port';
import { ConfirmedSaleItemContribution, CatalogProductDisplay } from '../../../domain/entities/loadSheet';
import { SalesDayNotClosedError } from '../../../domain/errors/salesDayNotClosed.error';
import { SalesDayNotFoundForLoadSheetError } from '../../../domain/errors/salesDayNotFoundForLoadSheet.error';
import { ProductNotFoundForLoadSheetError } from '../../../domain/errors/productNotFoundForLoadSheet.error';

function setup(status: 'OPEN' | 'CLOSED' | null = 'CLOSED') {
  let itemsRequested = false;
  const contributions: ConfirmedSaleItemContribution[] = [
    {
      productId: 'p-1',
      quantity: 10,
      wholesaleCost: 600,
      wholesaleSalePrice: 1000,
      totalPrice: 10000,
      profit: 4000
    },
    {
      productId: 'p-1',
      quantity: 5,
      wholesaleCost: 600,
      wholesaleSalePrice: 1000,
      totalPrice: 5000,
      profit: 2000
    }
  ];
  const displays: CatalogProductDisplay[] = [{ productId: 'p-1', brand: 'Acme', name: 'Catalog Soda' }];

  const salesDayClosureQuery: SalesDayClosureQuery = {
    async findById(salesDayId) {
      if (!status) return null;
      return { id: salesDayId, status };
    }
  };

  const confirmedSaleItemsQuery: ConfirmedSaleItemsQuery = {
    async findConfirmedBySalesDayId() {
      itemsRequested = true;
      return contributions;
    }
  };

  const catalogProductDisplayQuery: CatalogProductDisplayQuery = {
    async findByProductIds() {
      return displays;
    }
  };

  return {
    useCase: new GenerateLoadSheetUseCase(salesDayClosureQuery, confirmedSaleItemsQuery, catalogProductDisplayQuery),
    wasItemsRequested: () => itemsRequested,
    displays
  };
}

test('GenerateLoadSheetUseCase - aggregates confirmed items for a closed Sales Day', async () => {
  const { useCase } = setup('CLOSED');

  const result = await useCase.run({ salesDayId: 'sd-1' });

  assert.equal(result.isSuccess, true);
  assert.equal(result.value?.salesDayId, 'sd-1');
  assert.equal(result.value?.lines.length, 1);
  assert.equal(result.value?.lines[0].name, 'Catalog Soda');
  assert.equal(result.value?.lines[0].quantity, 15);
  assert.equal(result.value?.lines[0].totalPrice, 15000);
  assert.equal(result.value?.lines[0].profit, 6000);
});

test('GenerateLoadSheetUseCase - rejects an open Sales Day before reading sales', async () => {
  const { useCase, wasItemsRequested } = setup('OPEN');

  const result = await useCase.run({ salesDayId: 'sd-1' });

  assert.equal(result.isSuccess, false);
  assert.ok(result.error instanceof SalesDayNotClosedError);
  assert.equal(wasItemsRequested(), false);
});

test('GenerateLoadSheetUseCase - fails when the Sales Day does not exist', async () => {
  const { useCase } = setup(null);

  const result = await useCase.run({ salesDayId: 'missing' });

  assert.equal(result.isSuccess, false);
  assert.ok(result.error instanceof SalesDayNotFoundForLoadSheetError);
});

test('GenerateLoadSheetUseCase - fails when a sold product is missing from the catalog', async () => {
  const salesDayClosureQuery: SalesDayClosureQuery = {
    async findById(salesDayId) {
      return { id: salesDayId, status: 'CLOSED' };
    }
  };
  const confirmedSaleItemsQuery: ConfirmedSaleItemsQuery = {
    async findConfirmedBySalesDayId() {
      return [
        {
          productId: 'gone',
          quantity: 1,
          wholesaleCost: 1,
          wholesaleSalePrice: 2,
          totalPrice: 2,
          profit: 1
        }
      ];
    }
  };
  const catalogProductDisplayQuery: CatalogProductDisplayQuery = {
    async findByProductIds() {
      return [];
    }
  };
  const useCase = new GenerateLoadSheetUseCase(
    salesDayClosureQuery,
    confirmedSaleItemsQuery,
    catalogProductDisplayQuery
  );

  const result = await useCase.run({ salesDayId: 'sd-1' });

  assert.equal(result.isSuccess, false);
  assert.ok(result.error instanceof ProductNotFoundForLoadSheetError);
});
