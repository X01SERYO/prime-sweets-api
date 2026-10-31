import path from 'path';
import express from 'express';
import { AppContainer } from '../dependency-injection/appContainer';
import { registerRoutes } from './routes';

export function createApp(container: AppContainer) {
  const app = express();
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });
  app.use(express.json());
  app.use('/company', express.static(path.join(process.cwd(), 'public', 'company')));

  registerRoutes(app, container);

  return app;
}
