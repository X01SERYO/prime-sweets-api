import test from 'node:test';
import assert from 'node:assert/strict';
import { Customer } from '../../../../../../../contexts/customers/domain/entities/customer';
import { CustomerRepository } from '../../../../../../../contexts/customers/application/ports/outbound/customer.repository';
import { UpdateCustomerUseCase } from '../../../../../../../contexts/customers/application/use-cases/updateCustomer/updateCustomer.useCase';
import { CustomerNotFoundError } from '../../../../../../../contexts/customers/domain/errors/customerNotFound.error';
import { CustomerAlreadyExistsError } from '../../../../../../../contexts/customers/domain/errors/customerAlreadyExists.error';
import { InvalidCustomerError } from '../../../../../../../contexts/customers/domain/errors/invalidCustomer.error';

class InMemoryCustomerRepository implements CustomerRepository {
  public customers: Customer[] = [];

  async findById(id: string): Promise<Customer | null> {
    return this.customers.find((c) => c.id === id) ?? null;
  }

  async findByDocument(documentType: string, documentNumber: string): Promise<Customer | null> {
    return (
      this.customers.find(
        (c) => c.documentType.toLowerCase() === documentType.toLowerCase() && c.documentNumber === documentNumber
      ) ?? null
    );
  }

  async search(_term: string): Promise<Customer[]> {
    return [];
  }

  async findAll(): Promise<Customer[]> {
    return [...this.customers];
  }

  async save(customer: Customer): Promise<void> {
    const idx = this.customers.findIndex((c) => c.id === customer.id);
    if (idx >= 0) {
      this.customers[idx] = customer;
    } else {
      this.customers.push(customer);
    }
  }
}

test('UpdateCustomerUseCase - successfully updates customer fields', async () => {
  const repository = new InMemoryCustomerRepository();
  await repository.save(
    Customer.create({
      id: 'cust-1',
      documentType: 'CC',
      documentNumber: '55443322',
      name: 'Tienda Vieja'
    })
  );

  const useCase = new UpdateCustomerUseCase(repository);
  const result = await useCase.run({
    id: 'cust-1',
    name: 'Tienda Renovada',
    phone: '3201112233',
    address: 'Avenida Siempre Viva 742'
  });

  assert.equal(result.isSuccess, true);
  assert.equal(result.value!.name, 'Tienda Renovada');
  assert.equal(result.value!.phone, '3201112233');
  assert.equal(result.value!.address, 'Avenida Siempre Viva 742');

  const inRepo = await repository.findById('cust-1');
  assert.equal(inRepo?.name, 'Tienda Renovada');
});

test('UpdateCustomerUseCase - fails if customer does not exist', async () => {
  const repository = new InMemoryCustomerRepository();
  const useCase = new UpdateCustomerUseCase(repository);

  const result = await useCase.run({
    id: 'unknown-id',
    name: 'Nuevo Nombre'
  });

  assert.equal(result.isSuccess, false);
  assert.ok(result.error instanceof CustomerNotFoundError);
});

test('UpdateCustomerUseCase - fails if updating to a document already belonging to another customer', async () => {
  const repository = new InMemoryCustomerRepository();
  await repository.save(
    Customer.create({
      id: 'cust-1',
      documentType: 'CC',
      documentNumber: '111',
      name: 'Cliente Uno'
    })
  );
  await repository.save(
    Customer.create({
      id: 'cust-2',
      documentType: 'CC',
      documentNumber: '222',
      name: 'Cliente Dos'
    })
  );

  const useCase = new UpdateCustomerUseCase(repository);
  const result = await useCase.run({
    id: 'cust-2',
    documentNumber: '111'
  });

  assert.equal(result.isSuccess, false);
  assert.ok(result.error instanceof CustomerAlreadyExistsError);
});

test('UpdateCustomerUseCase - rejects empty id or empty required fields', async () => {
  const repository = new InMemoryCustomerRepository();
  await repository.save(
    Customer.create({
      id: 'cust-1',
      documentType: 'CC',
      documentNumber: '111',
      name: 'Cliente Uno'
    })
  );
  const useCase = new UpdateCustomerUseCase(repository);

  const res1 = await useCase.run({ id: '  ' });
  assert.equal(res1.isSuccess, false);
  assert.ok(res1.error instanceof InvalidCustomerError);

  const res2 = await useCase.run({ id: 'cust-1', name: '   ' });
  assert.equal(res2.isSuccess, false);
  assert.ok(res2.error instanceof InvalidCustomerError);
});
