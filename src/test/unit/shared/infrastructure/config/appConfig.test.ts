import test from 'node:test';
import assert from 'node:assert/strict';
import { ConfigurationError, loadAppConfig } from '@/shared/infrastructure/config/appConfig';

const required = {
  DATABASE_URL: 'postgresql://postgres:secret@127.0.0.1:5432/prime_sweets'
};

test('loadAppConfig - applies defaults and reads the database connection string', () => {
  const config = loadAppConfig(required);

  assert.equal(config.port, 3000);
  assert.equal(config.db.host, '127.0.0.1');
  assert.equal(config.db.port, 5432);
  assert.equal(config.db.user, 'postgres');
  assert.equal(config.db.password, 'secret');
  assert.equal(config.db.name, 'prime_sweets');
  assert.equal(config.db.ssl, true);
  assert.equal(config.businessTimeZone, 'America/Bogota');
  assert.equal(config.company.name, '');
});

test('loadAppConfig - disables database SSL when the connection string says so', () => {
  const config = loadAppConfig({
    DATABASE_URL: 'postgresql://postgres:secret@127.0.0.1:5432/prime_sweets?sslmode=disable'
  });
  assert.equal(config.db.ssl, false);
});

test('loadAppConfig - fails when the connection string is missing', () => {
  assert.throws(() => loadAppConfig({}), ConfigurationError);
});

test('loadAppConfig - fails when the connection string is not a URL', () => {
  assert.throws(() => loadAppConfig({ DATABASE_URL: 'not-a-url' }), ConfigurationError);
});
