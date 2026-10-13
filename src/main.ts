import 'dotenv/config';
import 'reflect-metadata';
import { loadAppConfig, getAppConfig } from './shared/infrastructure/config/appConfig';
import { startApi } from './apps/api/server';
import { buildContainer } from './apps/dependency-injection';

async function bootstrap() {
  try {
    loadAppConfig();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }

  const container = await buildContainer();
  const dataSource = container.get('shared.infrastructure.persistence.typeorm.data_source');
  if (!dataSource.isInitialized) {
    try {
      await dataSource.initialize();
    } catch (error) {
      const config = getAppConfig();
      console.error(
        `No se pudo conectar a PostgreSQL en ${config.db.host}:${config.db.port} (database: ${config.db.name}). ` +
          'Arranca Postgres, crea la base y revisa DB_HOST, DB_PORT, DB_USER, DB_PASSWORD y DB_NAME en .env.'
      );
      console.error(error);
      process.exit(1);
    }
  }
  await startApi(container);
}

bootstrap();
