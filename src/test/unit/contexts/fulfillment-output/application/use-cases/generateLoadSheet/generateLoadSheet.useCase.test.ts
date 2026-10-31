import test from 'node:test';
import assert from 'node:assert/strict';
import { GenerateLoadSheetUseCase } from '../../../../../../../contexts/fulfillment-output/application/use-cases/generateLoadSheet/generateLoadSheet.useCase';
import { ConfirmedSaleItemsQuery } from '../../../../../../../contexts/fulfillment-output/application/ports/outbound/confirmedSaleItemsQuery.port';
import { CatalogProductDisplayQuery } from '../../../../../../../contexts/fulfillment-output/application/ports/outbound/catalogProductDisplayQuery.port';
import { ConfirmedSaleItemContribution, CatalogProductDisplay } from '../../../../../../../contexts/fulfillment-output/domain/entities/loadSheet';
import { InvalidLoadSheetDeliveryDateError } from '../../../../../../../contexts/fulfillment-output/domain/errors/invalidLoadSheetDeliveryDate.error';
import { ProductNotFoundForLoadSheetError } from '../../../../../../../contexts/fulfillment-output/domain/errors/productNotFoundForLoadSheet.error';

function setup() {
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
  const displays: CatalogProductDisplay[] = [
    { productId: 'p-1', brand: 'Acme', name: 'Catalog Soda', wholesaleCost: 600, wholesaleSalePrice: 1000 }
  ];

  const confirmedSaleItemsQuery: ConfirmedSaleItemsQuery = {
    async findConfirmedByDeliveryDate() {
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
    useCase: new GenerateLoadSheetUseCase(confirmedSaleItemsQuery, catalogProductDisplayQuery),
    wasItemsRequested: () => itemsRequested,
    displays
  };
}

test('GenerateLoadSheetUseCase - aggregates confirmed items for a delivery date', async () => {
  const { useCase } = setup();

  const result = await useCase.run({ deliveryDate: '2026-10-31' });

  assert.equal(result.isSuccess, true);
  assert.equal(result.value?.deliveryDate, '2026-10-31');
  assert.equal(result.value?.lines.length, 1);
  assert.equal(result.value?.lines[0].name, 'Catalog Soda');
  assert.equal(result.value?.lines[0].quantity, 15);
  assert.equal(result.value?.lines[0].totalPrice, 15000);
  assert.equal(result.value?.lines[0].profit, 6000);
});

test('GenerateLoadSheetUseCase - rejects a missing delivery date before reading sales', async () => {
  const { useCase, wasItemsRequested } = setup();

  const result = await useCase.run({ deliveryDate: '' });

  assert.equal(result.isSuccess, false);
  assert.ok(result.error instanceof InvalidLoadSheetDeliveryDateError);
  assert.equal(wasItemsRequested(), false);
});

test('GenerateLoadSheetUseCase - fails when a sold product is missing from the catalog', async () => {
  const confirmedSaleItemsQuery: ConfirmedSaleItemsQuery = {
    async findConfirmedByDeliveryDate() {
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
  const useCase = new GenerateLoadSheetUseCase(confirmedSaleItemsQuery, catalogProductDisplayQuery);

  const result = await useCase.run({ deliveryDate: '2026-10-31' });

  assert.equal(result.isSuccess, false);
  assert.ok(result.error instanceof ProductNotFoundForLoadSheetError);
});
