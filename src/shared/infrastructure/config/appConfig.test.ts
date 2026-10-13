import test from 'node:test';
import assert from 'node:assert/strict';
import { ConfigurationError, loadAppConfig } from './appConfig';

const required = {
  DB_USER: 'postgres',
  DB_NAME: 'prime_sweets'
};

test('loadAppConfig - applies defaults and reads the database identity', () => {
  const config = loadAppConfig(required);

  assert.equal(config.port, 3000);
  assert.equal(config.db.host, '127.0.0.1');
  assert.equal(config.db.port, 5432);
  assert.equal(config.db.user, 'postgres');
  assert.equal(config.db.password, '');
  assert.equal(config.db.name, 'prime_sweets');
  assert.equal(config.businessTimeZone, 'America/Bogota');
  assert.equal(config.company.name, '');
});

test('loadAppConfig - fails when a critical database variable is missing', () => {
  assert.throws(() => loadAppConfig({ DB_NAME: 'prime_sweets' }), ConfigurationError);
});

test('loadAppConfig - fails when a port is not a positive integer', () => {
  assert.throws(() => loadAppConfig({ ...required, DB_PORT: 'abc' }), ConfigurationError);
});
