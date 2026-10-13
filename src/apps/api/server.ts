import { createApp } from './app';
import { getAppConfig } from '../../shared/infrastructure/config/appConfig';

export async function startApi(container: any) {
  const app = createApp(container);
  const port =
    container.hasParameter && container.hasParameter('config.port')
      ? container.getParameter('config.port')
      : getAppConfig().port;

  app.listen(port, () => {
    console.log(`API running on port ${port}`);
  });
}
