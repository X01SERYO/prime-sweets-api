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
          'El acceso local sigue disponible. El resto de módulos necesita la base.'
      );
      console.error(error);
    }
  }
  await startApi(container);
}

bootstrap();
