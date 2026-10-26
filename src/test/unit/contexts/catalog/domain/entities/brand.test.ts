import test from 'node:test';
import assert from 'node:assert/strict';
import { Brand } from '../../../../../../contexts/catalog/domain/entities/brand';
import { InvalidBrandError } from '../../../../../../contexts/catalog/domain/errors/invalidBrand.error';

test('Brand.create rejects a blank name with a domain error', () => {
  assert.throws(() => Brand.create('brand-1', '  ', 'ACM'), InvalidBrandError);
});

test('Brand.create rejects a blank code with a domain error', () => {
  assert.throws(() => Brand.create('brand-1', 'Acme', ' '), InvalidBrandError);
});
