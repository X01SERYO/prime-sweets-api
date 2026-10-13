import 'dotenv/config';
import 'reflect-metadata';
import { startApi } from './apps/api/server';
import { buildContainer } from './apps/dependency-injection';

async function bootstrap() {
  const container = await buildContainer();
  const dataSource = container.get('shared.infrastructure.persistence.typeorm.data_source');
  if (!dataSource.isInitialized) {
    try {
      await dataSource.initialize();
    } catch (error) {
      const host = process.env.DB_HOST ?? 'localhost';
      const port = process.env.DB_PORT ?? '5432';
      const database = process.env.DB_NAME ?? '(undefined)';
      console.error(
        `No se pudo conectar a PostgreSQL en ${host}:${port} (database: ${database}). ` +
          'Arranca Postgres, crea la base y revisa DB_HOST, DB_PORT, DB_USER, DB_PASSWORD y DB_NAME en .env.'
      );
      console.error(error);
      process.exit(1);
    }
  }
  await startApi(container);
}

bootstrap();
