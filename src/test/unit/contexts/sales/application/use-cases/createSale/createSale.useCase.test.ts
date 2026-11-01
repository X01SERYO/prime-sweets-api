import test from 'node:test';
import assert from 'node:assert/strict';
import { CreateSaleUseCase } from '../../../../../../../contexts/sales/application/use-cases/createSale/createSale.useCase';
import { Sale } from '../../../../../../../contexts/sales/domain/entities/sale';
import { SaleRepository } from '../../../../../../../contexts/sales/application/ports/outbound/sale.repository';
import { BusinessCalendar } from '../../../../../../../contexts/sales/application/ports/outbound/businessCalendar.port';
import { CustomerChecker } from '../../../../../../../contexts/sales/application/ports/outbound/customerChecker.port';
import { ProductSnapshot, ProductSnapshotProvider } from '../../../../../../../contexts/sales/application/ports/outbound/productSnapshotProvider.port';
import { DeliveryDateOutOfRangeError } from '../../../../../../../contexts/sales/domain/errors/deliveryDateOutOfRange.error';
import { CustomerNotFoundForSaleError } from '../../../../../../../contexts/sales/domain/errors/customerNotFoundForSale.error';
import { ProductNotFoundForSaleError } from '../../../../../../../contexts/sales/domain/errors/productNotFoundForSale.error';

const ids = { next: () => `id-${Math.random()}` };

function createMocks() {
  const savedSales: Sale[] = [];
  const repo: SaleRepository = {
    async save(sale: Sale) {
      savedSales.push(sale);
    },
    async findById(id: string) {
      return savedSales.find((s) => s.id === id) ?? null;
    },
    async list() {
      return savedSales;
    }
  };

  const calendar: BusinessCalendar = {
    today: () => '2026-11-04'
  };

  let customerFound = true;
  const customerChecker: CustomerChecker = {
    async customerExists() {
      return customerFound;
    }
  };

  const snapshots = new Map<string, ProductSnapshot>([
    [
      'prod-1',
      {
        id: 'prod-1',
        code: 'COL001',
        name: 'Gomitas Ácidas',
        wholesalePrice: 1500,
        wholesaleCost: 900
      }
    ]
  ]);

  const productProvider: ProductSnapshotProvider = {
    async getSnapshot(productId: string) {
      return snapshots.get(productId) ?? null;
    }
  };

  return {
    repo,
    savedSales,
    calendar,
    customerChecker,
    setCustomerExists: (exists: boolean) => {
      customerFound = exists;
    },
    productProvider
  };
}

test('CreateSaleUseCase - successfully creates a draft sale without initial items', async () => {
  const { repo, calendar, customerChecker, productProvider, savedSales } = createMocks();
  const useCase = new CreateSaleUseCase(repo, customerChecker, productProvider, calendar, ids);

  const result = await useCase.run({
    sellerId: 'seller-1',
    customerId: 'cust-001',
    deliveryDate: '2026-11-05'
  });

  assert.equal(result.isSuccess, true);
  assert.equal(result.value?.status, 'DRAFT');
  assert.equal(result.value?.sellerId, 'seller-1');
  assert.equal(result.value?.captureDate, '2026-11-04');
  assert.equal(result.value?.customerId, 'cust-001');
  assert.equal(result.value?.items.length, 0);
  assert.equal(savedSales.length, 1);
});

test('CreateSaleUseCase - creates sale with initial items snapshotting prices', async () => {
  const { repo, calendar, customerChecker, productProvider } = createMocks();
  const useCase = new CreateSaleUseCase(repo, customerChecker, productProvider, calendar, ids);

  const result = await useCase.run({
    sellerId: 'seller-1',
    customerId: 'cust-001',
    deliveryDate: '2026-11-05',
    items: [
      {
        productId: 'prod-1',
        itemName: 'Gomitas Especiales',
        quantity: 3
      }
    ]
  });

  assert.equal(result.isSuccess, true);
  assert.equal(result.value?.items.length, 1);
  assert.equal(result.value?.items[0].itemName, 'Gomitas Especiales');
  assert.equal(result.value?.items[0].wholesalePrice, 1500);
  assert.equal(result.value?.items[0].wholesaleCost, 900);
  assert.equal(result.value?.totalAmount, 4500);
  assert.equal(result.value?.totalProfit, 1800); // 4500 - 2700
});

test('CreateSaleUseCase - fails if the delivery date is before today', async () => {
  const { repo, calendar, customerChecker, productProvider } = createMocks();
  const useCase = new CreateSaleUseCase(repo, customerChecker, productProvider, calendar, ids);
  const result = await useCase.run({
    sellerId: 'seller-1',
    customerId: 'cust-001',
    deliveryDate: '2026-11-03'
  });

  assert.equal(result.isSuccess, false);
  assert.ok(result.error instanceof DeliveryDateOutOfRangeError);
});

test('CreateSaleUseCase - fails if customer does not exist', async () => {
  const { repo, calendar, customerChecker, productProvider, setCustomerExists } = createMocks();
  setCustomerExists(false);

  const useCase = new CreateSaleUseCase(repo, customerChecker, productProvider, calendar, ids);
  const result = await useCase.run({
    sellerId: 'seller-1',
    customerId: 'cust-999',
    deliveryDate: '2026-11-05'
  });

  assert.equal(result.isSuccess, false);
  assert.ok(result.error instanceof CustomerNotFoundForSaleError);
});

test('CreateSaleUseCase - fails if initial item product is not found in catalog', async () => {
  const { repo, calendar, customerChecker, productProvider } = createMocks();
  const useCase = new CreateSaleUseCase(repo, customerChecker, productProvider, calendar, ids);

  const result = await useCase.run({
    sellerId: 'seller-1',
    customerId: 'cust-001',
    deliveryDate: '2026-11-05',
    items: [{ productId: 'non-existent', quantity: 2 }]
  });

  assert.equal(result.isSuccess, false);
  assert.ok(result.error instanceof ProductNotFoundForSaleError);
});
