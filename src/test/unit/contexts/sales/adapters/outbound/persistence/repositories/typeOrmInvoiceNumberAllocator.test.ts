import test from 'node:test';
import assert from 'node:assert/strict';
import { DataSource } from 'typeorm';
import { TypeOrmInvoiceNumberAllocator } from '@/contexts/sales/adapters/outbound/persistence/repositories/typeOrmInvoiceNumberAllocator';

test('TypeOrmInvoiceNumberAllocator formats the value returned by the sequence', async () => {
  const dataSource = {
    transaction: async (run: (trx: { query: () => Promise<Array<{ current_value: number }>> }) => Promise<unknown>) =>
      run({ query: async () => [{ current_value: 7 }] })
  } as unknown as DataSource;
  const number = await new TypeOrmInvoiceNumberAllocator(dataSource).allocateNext('2026-11-14');
  assert.equal(number, '007');
});
