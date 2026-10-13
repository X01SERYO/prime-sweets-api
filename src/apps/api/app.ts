import express from 'express';
import { registerRoutes } from './routes';

export function createApp(container: any) {
  const app = express();
  app.use(express.json());

  registerRoutes(app, container);

  return app;
}
