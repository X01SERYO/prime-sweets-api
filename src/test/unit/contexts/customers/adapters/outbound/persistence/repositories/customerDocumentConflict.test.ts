import test from 'node:test';
import assert from 'node:assert/strict';
import { isUniqueCustomerDocumentViolation } from '../../../../../../../../contexts/customers/adapters/outbound/persistence/repositories/customerDocumentConflict';

test('isUniqueCustomerDocumentViolation - matches the customer document unique index', () => {
  assert.equal(
    isUniqueCustomerDocumentViolation({
      driverError: { code: '23505', constraint: 'UQ_customers_document' }
    }),
    true
  );
});

test('isUniqueCustomerDocumentViolation - ignores other unique violations', () => {
  assert.equal(
    isUniqueCustomerDocumentViolation({
      driverError: { code: '23505', constraint: 'PK_customers' }
    }),
    false
  );
  assert.equal(isUniqueCustomerDocumentViolation(new Error('connection refused')), false);
});
