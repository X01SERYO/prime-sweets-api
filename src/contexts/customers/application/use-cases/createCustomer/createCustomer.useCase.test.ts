import test from 'node:test';
import assert from 'node:assert/strict';
import { Customer } from '../../../domain/entities/customer';
import { CustomerRepository } from '../../ports/outbound/customer.repository';
import { CreateCustomerUseCase } from './createCustomer.useCase';
import { CustomerAlreadyExistsError } from '../../../domain/errors/customerAlreadyExists.error';
import { InvalidCustomerError } from '../../../domain/errors/invalidCustomer.error';

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

  async search(term: string): Promise<Customer[]> {
    const lower = term.toLowerCase();
    return this.customers.filter(
      (c) => c.name.toLowerCase().includes(lower) || c.documentNumber.includes(lower)
    );
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

test('CreateCustomerUseCase - successfully creates a new customer', async () => {
  const repository = new InMemoryCustomerRepository();
  const useCase = new CreateCustomerUseCase(repository);

  const result = await useCase.run({
    documentType: 'CC',
    documentNumber: '10203040',
    name: 'Tienda La Esperanza',
    phone: '3001234567',
    email: 'esperanza@gmail.com',
    address: 'Calle 5 # 10-20'
  });

  assert.equal(result.isSuccess, true);
  assert.equal(result.value!.documentType, 'CC');
  assert.equal(result.value!.documentNumber, '10203040');
  assert.equal(result.value!.name, 'Tienda La Esperanza');
  assert.equal(result.value!.phone, '3001234567');
  assert.equal(result.value!.email, 'esperanza@gmail.com');
  assert.equal(result.value!.address, 'Calle 5 # 10-20');
  assert.ok(result.value!.id);

  const inRepo = await repository.findById(result.value!.id);
  assert.ok(inRepo);
  assert.equal(inRepo.name, 'Tienda La Esperanza');
});

test('CreateCustomerUseCase - rejects duplicate customer by document', async () => {
  const repository = new InMemoryCustomerRepository();
  await repository.save(
    Customer.create({
      id: 'cust-1',
      documentType: 'CC',
      documentNumber: '10203040',
      name: 'Cliente Existente'
    })
  );

  const useCase = new CreateCustomerUseCase(repository);
  const result = await useCase.run({
    documentType: 'CC',
    documentNumber: '10203040',
    name: 'Otro Nombre'
  });

  assert.equal(result.isSuccess, false);
  assert.ok(result.error instanceof CustomerAlreadyExistsError);
});

test('CreateCustomerUseCase - fails on missing mandatory fields', async () => {
  const repository = new InMemoryCustomerRepository();
  const useCase = new CreateCustomerUseCase(repository);

  const res1 = await useCase.run({ documentType: '', documentNumber: '123', name: 'Nombre' });
  assert.equal(res1.isSuccess, false);
  assert.ok(res1.error instanceof InvalidCustomerError);

  const res2 = await useCase.run({ documentType: 'CC', documentNumber: '   ', name: 'Nombre' });
  assert.equal(res2.isSuccess, false);
  assert.ok(res2.error instanceof InvalidCustomerError);

  const res3 = await useCase.run({ documentType: 'CC', documentNumber: '123', name: '' });
  assert.equal(res3.isSuccess, false);
  assert.ok(res3.error instanceof InvalidCustomerError);
});
