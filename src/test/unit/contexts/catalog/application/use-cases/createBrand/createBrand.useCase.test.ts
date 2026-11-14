import test from 'node:test';
import assert from 'node:assert/strict';
import { CreateBrandUseCase } from '../../../../../../../contexts/catalog/application/use-cases/createBrand/createBrand.useCase';
import { UpdateBrandUseCase } from '../../../../../../../contexts/catalog/application/use-cases/updateBrand/updateBrand.useCase';
import { Brand } from '../../../../../../../contexts/catalog/domain/entities/brand';
import { BrandRepository } from '../../../../../../../contexts/catalog/application/ports/outbound/brand.repository';
import { BrandAlreadyExistsError } from '../../../../../../../contexts/catalog/domain/errors/brandAlreadyExists.error';
import { BrandNotFoundError } from '../../../../../../../contexts/catalog/domain/errors/brandNotFound.error';

function brands(found: Brand | null): BrandRepository {
  return {
    async save() {},
    async findById() {
      return found;
    },
    async findByName() {
      return found;
    },
    async findByCode() {
      return null;
    },
    async findAll() {
      return [];
    },
    async delete() {}
  };
}

test('CreateBrandUseCase stores a new brand and rejects a duplicate name', async () => {
  const created = await new CreateBrandUseCase(
    { ...brands(null), async findByName() { return null; } },
    { next: () => 'b-1' }
  ).run({ name: 'acme', code: 'acm' });
  assert.equal(created.value?.code, 'ACM');

  const duplicate = await new CreateBrandUseCase(brands(Brand.create('b-2', 'Acme', 'ZZ')), { next: () => 'b-1' }).run({
    name: 'acme',
    code: 'acm'
  });
  assert.ok(duplicate.error instanceof BrandAlreadyExistsError);

  const invalid = await new CreateBrandUseCase(brands(null), { next: () => 'b-1' }).run({ name: ' ', code: 'acm' });
  assert.equal(invalid.isSuccess, false);
});

test('UpdateBrandUseCase updates, rejects a missing brand, and rejects a taken code', async () => {
  const missing = await new UpdateBrandUseCase(brands(null)).run({ id: 'b-1', name: 'Acme' });
  assert.ok(missing.error instanceof BrandNotFoundError);

  const current = Brand.create('b-1', 'Acme', 'ACM');
  const other = Brand.create('b-2', 'Other', 'ZZZ');
  const repository = brands(current);
  repository.findByCode = async () => other;
  repository.findByName = async () => null;
  const taken = await new UpdateBrandUseCase(repository).run({ id: 'b-1', code: 'zzz' });
  assert.ok(taken.error instanceof BrandAlreadyExistsError);

  repository.findByCode = async () => null;
  const updated = await new UpdateBrandUseCase(repository).run({ id: 'b-1', name: 'Nueva' });
  assert.equal(updated.value?.name, 'NUEVA');
});
