import { AppContainer } from '@/apps/dependency-injection/appContainer';
import { createApp } from './app';
import { getAppConfig } from '@/shared/infrastructure/config/appConfig';
import { log } from '@/shared/infrastructure/logging/logger';

export async function startApi(container: AppContainer) {
  const app = createApp(container);
  const port =
    container.hasParameter && container.hasParameter('config.port')
      ? container.getParameter('config.port')
      : getAppConfig().port;

  const server = app.listen(port, () => {
    log('info', 'api.started', { port });
  });

  function stop(signal: string) {
    log('info', 'api.stopping', { signal });
    server.close(() => {
      log('info', 'api.stopped', { signal });
      process.exit(0);
    });
  }

  process.once('SIGINT', () => stop('SIGINT'));
  process.once('SIGTERM', () => stop('SIGTERM'));
}
