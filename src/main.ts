import 'dotenv/config';
import 'reflect-metadata';
import { loadAppConfig, getAppConfig } from './shared/infrastructure/config/appConfig';
import { startApi } from './apps/api/server';
import { buildContainer } from './apps/dependency-injection/index';
import { log } from './shared/infrastructure/logging/logger';

async function bootstrap() {
  try {
    loadAppConfig();
  } catch (error) {
    log('error', 'config.invalid', {
      message: error instanceof Error ? error.message : 'config invalid'
    });
    process.exit(1);
  }

  const container = await buildContainer();
  const dataSource = container.get('shared.infrastructure.persistence.typeorm.data_source');
  if (!dataSource.isInitialized) {
    try {
      await dataSource.initialize();
    } catch (error) {
      const config = getAppConfig();
      log('error', 'db.unavailable', {
        host: config.db.host,
        port: config.db.port,
        database: config.db.name,
        message: error instanceof Error ? error.message : 'database unavailable'
      });
    }
  }
  await startApi(container);
}

bootstrap();
