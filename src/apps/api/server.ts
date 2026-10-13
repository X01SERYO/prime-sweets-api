import { createApp } from './app';

export async function startApi(container: any) {
  const app = createApp(container);
  const port = container.hasParameter && container.hasParameter('config.port')
    ? container.getParameter('config.port')
    : (process.env.PORT ?? 3000);

  app.listen(port, () => {
    console.log(`API running on port ${port}`);
  });
}
