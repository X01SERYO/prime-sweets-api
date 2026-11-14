import { NextFunction, Request, Response } from 'express';
import { bearerToken } from '@apps/http/bearerToken';
import { httpResponse } from '@apps/controllers/httpResponse';
import { AppContainer } from '@apps/dependency-injection/appContainer';

export function requireSession(container: AppContainer) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const useCase = container.get('identity.application.get_session_use_case');
    const result = await useCase.run(bearerToken(req));
    if (!result.isSuccess) {
      httpResponse(res, result);
      return;
    }
    res.locals.session = result.value;
    next();
  };
}
