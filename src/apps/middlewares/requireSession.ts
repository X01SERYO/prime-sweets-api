import { NextFunction, Request, Response } from 'express';
import { bearerToken } from '../http/bearerToken';
import { httpResponse } from '../controllers/httpResponse';
import { GetSessionUseCase } from '../../contexts/identity/application/use-cases/getSession/getSession.useCase';

interface SessionContainer {
  get(key: string): GetSessionUseCase;
}

export function requireSession(container: SessionContainer) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const useCase = container.get('identity.application.get_session_use_case');
    const result = await useCase.run(bearerToken(req));
    if (!result.isSuccess) {
      httpResponse(res, result);
      return;
    }
    next();
  };
}
