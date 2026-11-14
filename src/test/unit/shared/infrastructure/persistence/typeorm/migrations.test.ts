import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'fs';
import path from 'path';
import { MigrationInterface, QueryRunner } from 'typeorm';

const migrationsDir = path.join(
  __dirname,
  '../../../../../../shared/infrastructure/persistence/typeorm/migrations'
);

test('every migration runs up and down against a query runner', async () => {
  const runner = new Proxy(
    {},
    { get: () => async () => undefined }
  ) as QueryRunner;
  const files = readdirSync(migrationsDir).filter((file) => file.endsWith('.js') || file.endsWith('.ts'));
  assert.equal(files.length > 0, true);

  for (const file of files) {
    const loaded = require(path.join(migrationsDir, file)) as Record<string, new () => MigrationInterface>;
    const Migration = Object.values(loaded).find((value) => typeof value === 'function');
    assert.ok(Migration);
    const migration = new Migration();
    await migration.up(runner);
    await migration.down(runner);
  }
});
