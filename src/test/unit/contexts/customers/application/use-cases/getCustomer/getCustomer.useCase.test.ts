import test from 'node:test';
import assert from 'node:assert/strict';
import { Customer } from '../../../../../../../contexts/customers/domain/entities/customer';
import { CustomerRepository } from '../../../../../../../contexts/customers/application/ports/outbound/customer.repository';
import { GetCustomerUseCase } from '../../../../../../../contexts/customers/application/use-cases/getCustomer/getCustomer.useCase';
import { CustomerNotFoundError } from '../../../../../../../contexts/customers/domain/errors/customerNotFound.error';
import { InvalidCustomerError } from '../../../../../../../contexts/customers/domain/errors/invalidCustomer.error';

class InMemoryCustomerRepository implements CustomerRepository {
  public customers: Customer[] = [];

  async findById(id: string): Promise<Customer | null> {
    return this.customers.find((c) => c.id === id) ?? null;
  }

  async findByDocument(_type: string, _number: string): Promise<Customer | null> {
    return null;
  }

  async search(_term: string): Promise<Customer[]> {
    return [];
  }

  async findAll(): Promise<Customer[]> {
    return [...this.customers];
  }

  async save(customer: Customer): Promise<void> {
    this.customers.push(customer);
  }
}

test('GetCustomerUseCase - returns customer primitives when found', async () => {
  const repository = new InMemoryCustomerRepository();
  await repository.save(
    Customer.create({
      id: 'cust-123',
      documentType: 'NIT',
      documentNumber: '900999888-1',
      name: 'Supermercado Central'
    })
  );

  const useCase = new GetCustomerUseCase(repository);
  const result = await useCase.run('cust-123');

  assert.equal(result.isSuccess, true);
  assert.equal(result.value!.id, 'cust-123');
  assert.equal(result.value!.name, 'Supermercado Central');
  assert.equal(result.value!.documentType, 'NIT');
});

test('GetCustomerUseCase - fails with CustomerNotFoundError when not found', async () => {
  const repository = new InMemoryCustomerRepository();
  const useCase = new GetCustomerUseCase(repository);
  const result = await useCase.run('non-existent');

  assert.equal(result.isSuccess, false);
  assert.ok(result.error instanceof CustomerNotFoundError);
});

test('GetCustomerUseCase - fails with InvalidCustomerError when id is empty', async () => {
  const repository = new InMemoryCustomerRepository();
  const useCase = new GetCustomerUseCase(repository);
  const result = await useCase.run('   ');

  assert.equal(result.isSuccess, false);
  assert.ok(result.error instanceof InvalidCustomerError);
});
