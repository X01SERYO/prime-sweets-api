import { z } from 'zod';

const requiredText = z.preprocess(
  value => (typeof value === 'string' ? value.trim() : ''),
  z.string().min(1, 'is required')
);

const optionalText = z.preprocess(value => (typeof value === 'string' ? value.trim() : ''), z.string());

const numberWithDefault = (fallback: number) =>
  z.preprocess(value => (value === undefined || value === '' ? fallback : value), z.coerce.number().int().positive());

const environmentSchema = z.object({
  PORT: numberWithDefault(3000),
  DB_HOST: z.preprocess(
    value => (typeof value === 'string' && value.trim() !== '' ? value.trim() : '127.0.0.1'),
    z.string().min(1)
  ),
  DB_PORT: numberWithDefault(5432),
  DB_USER: requiredText,
  DB_PASSWORD: optionalText,
  DB_NAME: requiredText,
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
    db: {
      host: value.DB_HOST,
      port: value.DB_PORT,
      user: value.DB_USER,
      password: value.DB_PASSWORD,
      name: value.DB_NAME
    },
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
