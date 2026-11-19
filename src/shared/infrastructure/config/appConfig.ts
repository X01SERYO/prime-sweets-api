import { z } from 'zod';

const optionalText = z.preprocess(value => (typeof value === 'string' ? value.trim() : ''), z.string());

const numberWithDefault = (fallback: number) =>
  z.preprocess(value => (value === undefined || value === '' ? fallback : value), z.coerce.number().int().positive());

const environmentSchema = z.object({
  PORT: numberWithDefault(3000),
  DATABASE_URL: z.preprocess(
    value => (typeof value === 'string' ? value.trim() : ''),
    z.string().min(1, 'is required')
  ),
  BUSINESS_TIMEZONE: z.preprocess(
    value => (typeof value === 'string' && value.trim() !== '' ? value.trim() : 'America/Bogota'),
    z.string().min(1)
  ),
  ALEGRA_BASE_URL: optionalText,
  ALEGRA_TOKEN: optionalText,
  ALEGRA_PRICE_LIST_MAJOR_ID: optionalText,
  ALEGRA_PRICE_LIST_MINOR_ID: optionalText,
  COMPANY_NAME: optionalText,
  COMPANY_NIT: optionalText,
  COMPANY_CITY: optionalText,
  COMPANY_COUNTRY: optionalText,
  COMPANY_TELEPHONE: optionalText,
  COMPANY_LOGO: optionalText,
  COMPANY_LEGAL_TEXT: optionalText
});

export type AppConfig = {
  port: number;
  db: {
    host: string;
    port: number;
    user: string;
    password: string;
    name: string;
    ssl: boolean;
  };
  businessTimeZone: string;
  alegra: {
    baseUrl: string;
    token: string;
    wholesalePriceListId: string;
    retailPriceListId: string;
  };
  company: {
    name: string;
    nit: string;
    city: string;
    country: string;
    telephone: string;
    logo: string;
    legalText: string;
  };
};

export function postgresFromConnectionString(connectionString: string): AppConfig['db'] {
  let url: URL;
  try {
    url = new URL(connectionString);
  } catch {
    throw new ConfigurationError('Invalid environment configuration: DATABASE_URL: must be a Postgres connection string');
  }

  const database = decodeURIComponent(url.pathname.replace(/^\//, ''));
  const port = url.port ? Number(url.port) : 5432;
  const sslMode = (url.searchParams.get('sslmode') ?? '').toLowerCase();
  if (!url.hostname || !database || !url.username || !Number.isInteger(port) || port <= 0) {
    throw new ConfigurationError('Invalid environment configuration: DATABASE_URL: must include host, database, and user');
  }

  return {
    host: url.hostname,
    port,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    name: database,
    ssl: sslMode !== 'disable'
  };
}

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

let cached: AppConfig | null = null;

export function loadAppConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = environmentSchema.safeParse(env);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map(issue => `${issue.path.join('.') || 'environment'}: ${issue.message}`)
      .join('; ');
    throw new ConfigurationError(`Invalid environment configuration: ${details}`);
  }

  const value = parsed.data;
  cached = {
    port: value.PORT,
    db: postgresFromConnectionString(value.DATABASE_URL),
    businessTimeZone: value.BUSINESS_TIMEZONE,
    alegra: {
      baseUrl: value.ALEGRA_BASE_URL,
      token: value.ALEGRA_TOKEN,
      wholesalePriceListId: value.ALEGRA_PRICE_LIST_MAJOR_ID,
      retailPriceListId: value.ALEGRA_PRICE_LIST_MINOR_ID
    },
    company: {
      name: value.COMPANY_NAME,
      nit: value.COMPANY_NIT,
      city: value.COMPANY_CITY,
      country: value.COMPANY_COUNTRY,
      telephone: value.COMPANY_TELEPHONE,
      logo: value.COMPANY_LOGO,
      legalText: value.COMPANY_LEGAL_TEXT
    }
  };

  return cached;
}

export function getAppConfig(): AppConfig {
  if (!cached) {
    return loadAppConfig();
  }

  return cached;
}
