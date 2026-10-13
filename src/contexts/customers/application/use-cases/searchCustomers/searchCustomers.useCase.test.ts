import test from 'node:test';
import assert from 'node:assert/strict';
import { Customer } from '../../../domain/entities/customer';
import { CustomerRepository } from '../../ports/outbound/customer.repository';
import { SearchCustomersUseCase } from './searchCustomers.useCase';

class InMemoryCustomerRepository implements CustomerRepository {
  public searchCalledWith: string | null = null;
  public findAllCalled = false;

  private customers: Customer[] = [
    Customer.create({
      id: 'cust-1',
      documentType: 'CC',
      documentNumber: '11223344',
      name: 'Dulcería Don Pepe'
    }),
    Customer.create({
      id: 'cust-2',
      documentType: 'NIT',
      documentNumber: '901234567-8',
      name: 'Distribuidora Los Alpes'
    })
  ];

  async findById(_id: string): Promise<Customer | null> {
    return null;
  }

  async findByDocument(_type: string, _number: string): Promise<Customer | null> {
    return null;
  }

  async search(term: string): Promise<Customer[]> {
    this.searchCalledWith = term;
    const lower = term.toLowerCase();
    return this.customers.filter(
      (c) => c.name.toLowerCase().includes(lower) || c.documentNumber.includes(lower)
    );
  }

  async findAll(): Promise<Customer[]> {
    this.findAllCalled = true;
    return this.customers;
  }

  async save(_customer: Customer): Promise<void> {}
}

test('SearchCustomersUseCase - delegates to search when query is provided', async () => {
  const repository = new InMemoryCustomerRepository();
  const useCase = new SearchCustomersUseCase(repository);

  const result = await useCase.run({ query: 'Pepe' });

  assert.equal(result.isSuccess, true);
  assert.equal(repository.searchCalledWith, 'Pepe');
  assert.equal(repository.findAllCalled, false);
  assert.equal(result.value!.length, 1);
  assert.equal(result.value![0].name, 'Dulcería Don Pepe');
});

test('SearchCustomersUseCase - delegates to findAll when query is omitted or empty', async () => {
  const repository = new InMemoryCustomerRepository();
  const useCase = new SearchCustomersUseCase(repository);

  const result = await useCase.run({ query: '   ' });

  assert.equal(result.isSuccess, true);
  assert.equal(repository.findAllCalled, true);
  assert.equal(repository.searchCalledWith, null);
  assert.equal(result.value!.length, 2);
});
