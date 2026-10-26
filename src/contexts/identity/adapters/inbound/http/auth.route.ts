import { Request, Response, Router } from 'express';
import { httpResponse } from '../../../../../apps/controllers/httpResponse';
import { validateRequest } from '../../../../../apps/middlewares/validateRequest';
import { loginSchema } from './auth.schema';

function bearerToken(req: Request): string | undefined {
  const header = req.header('authorization');
  if (!header) {
    return undefined;
  }
  const [scheme, token] = header.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return undefined;
  }
  return token;
}

export function createAuthRouter(container: any) {
  const router = Router();

  router.post('/login', validateRequest(loginSchema), async (req: Request, res: Response) => {
    const useCase = container.get('identity.application.login_use_case');
    return httpResponse(res, await useCase.run({ email: req.body.email, password: req.body.password }));
  });

  router.get('/session', async (req: Request, res: Response) => {
    const useCase = container.get('identity.application.get_session_use_case');
    return httpResponse(res, await useCase.run(bearerToken(req)));
  });

  router.post('/logout', async (req: Request, res: Response) => {
    const useCase = container.get('identity.application.logout_use_case');
    return httpResponse(res, await useCase.run(bearerToken(req)));
  });

  return router;
}
