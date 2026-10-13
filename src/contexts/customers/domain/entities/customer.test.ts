import test from 'node:test';
import assert from 'node:assert/strict';
import { Customer } from './customer';
import { InvalidCustomerError } from '../errors/invalidCustomer.error';

test('Customer entity - creates valid customer instance with required fields', () => {
  const customer = Customer.create({
    id: 'cust-123',
    documentType: 'CC',
    documentNumber: '123456789',
    name: 'Tienda La Esquina'
  });

  assert.equal(customer.id, 'cust-123');
  assert.equal(customer.documentType, 'CC');
  assert.equal(customer.documentNumber, '123456789');
  assert.equal(customer.name, 'Tienda La Esquina');
  assert.equal(customer.phone, null);
  assert.equal(customer.email, null);
  assert.equal(customer.address, null);

  const primitives = customer.toPrimitives();
  assert.deepEqual(primitives, {
    id: 'cust-123',
    documentType: 'CC',
    documentNumber: '123456789',
    name: 'Tienda La Esquina',
    phone: null,
    email: null,
    address: null
  });
});

test('Customer entity - creates customer with optional informational fields', () => {
  const customer = Customer.create({
    id: 'cust-123',
    documentType: 'NIT',
    documentNumber: '900123456-1',
    name: 'Distribuidora Dulces S.A.S',
    phone: '3001234567',
    email: 'contacto@dulces.com',
    address: 'Calle 10 # 20-30'
  });

  assert.equal(customer.phone, '3001234567');
  assert.equal(customer.email, 'contacto@dulces.com');
  assert.equal(customer.address, 'Calle 10 # 20-30');
});

test('Customer entity - throws InvalidCustomerError when required fields are empty', () => {
  assert.throws(
    () => Customer.create({ id: '', documentType: 'CC', documentNumber: '123', name: 'Test' }),
    InvalidCustomerError
  );
  assert.throws(
    () => Customer.create({ id: '1', documentType: '  ', documentNumber: '123', name: 'Test' }),
    InvalidCustomerError
  );
  assert.throws(
    () => Customer.create({ id: '1', documentType: 'CC', documentNumber: '', name: 'Test' }),
    InvalidCustomerError
  );
  assert.throws(
    () => Customer.create({ id: '1', documentType: 'CC', documentNumber: '123', name: '   ' }),
    InvalidCustomerError
  );
});

test('Customer entity - updates fields correctly and validates invariants', () => {
  const customer = Customer.create({
    id: 'cust-123',
    documentType: 'CC',
    documentNumber: '123456789',
    name: 'Tienda La Esquina'
  });

  const updated = customer.update({
    name: 'Tienda La Esquina Nueva',
    phone: '3109876543',
    address: 'Carrera 15 # 45'
  });

  assert.equal(updated.name, 'Tienda La Esquina Nueva');
  assert.equal(updated.phone, '3109876543');
  assert.equal(updated.address, 'Carrera 15 # 45');
  assert.equal(updated.documentType, 'CC');
  assert.equal(updated.documentNumber, '123456789');

  assert.throws(() => customer.update({ name: '   ' }), InvalidCustomerError);
  assert.throws(() => customer.update({ documentType: '' }), InvalidCustomerError);
  assert.throws(() => customer.update({ documentNumber: ' ' }), InvalidCustomerError);
});
