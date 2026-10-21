import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { EnvCompanyProfileAdapter } from '../../../../../../contexts/fulfillment-output/adapters/outbound/envCompanyProfile.adapter';
import { loadAppConfig } from '../../../../../../shared/infrastructure/config/appConfig';

const keys = [
  'COMPANY_NAME',
  'COMPANY_NIT',
  'COMPANY_CITY',
  'COMPANY_COUNTRY',
  'COMPANY_TELEPHONE',
  'COMPANY_LOGO',
  'COMPANY_LEGAL_TEXT'
];

function withCompanyEnv(values: Record<string, string | undefined>, run: () => Promise<void>): Promise<void> {
  const previous = new Map(keys.map(key => [key, process.env[key]]));
  for (const key of keys) {
    const value = values[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  process.env.DB_USER ??= 'test';
  process.env.DB_NAME ??= 'prime_sweets_test';
  process.env.DB_PASSWORD ??= '';
  loadAppConfig();

  return run().finally(() => {
    for (const [key, value] of previous) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
    loadAppConfig();
  });
}

describe('EnvCompanyProfileAdapter', { concurrency: 1 }, () => {
  test('returns null until every company field is supplied', async () => {
    await withCompanyEnv({ COMPANY_NAME: 'Configured Company' }, async () => {
      const profile = await new EnvCompanyProfileAdapter().get();
      assert.equal(profile, null);
    });
  });

  test('returns the supplied company profile', async () => {
    await withCompanyEnv(
      {
        COMPANY_NAME: 'Configured Company',
        COMPANY_NIT: '900',
        COMPANY_CITY: 'Cali',
        COMPANY_COUNTRY: 'Colombia',
        COMPANY_TELEPHONE: '300',
        COMPANY_LOGO: 'logo-ref',
        COMPANY_LEGAL_TEXT: 'Configured legal text'
      },
      async () => {
        const profile = await new EnvCompanyProfileAdapter().get();
        assert.equal(profile?.name, 'Configured Company');
        assert.equal(profile?.legalText, 'Configured legal text');
        assert.equal(profile && 'taxRegime' in profile, false);
      }
    );
  });
});
