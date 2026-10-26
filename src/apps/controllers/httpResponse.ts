import { Response } from 'express';
import { Result } from '../../shared/application/result/result';
import { DomainError } from '../../shared/domain/errors/domainError';
import { NotFoundError } from '../../shared/domain/errors/notFound.error';
import { UnauthorizedError } from '../../shared/domain/errors/unauthorized.error';

export function httpResponse<T>(res: Response, result: Result<T>, successStatus = 200): Response {
  if (result.isSuccess) {
    return res.status(successStatus).json({
      success: true,
      data: result.value ?? null
    });
  }

  const error = result.error!;

  if (error instanceof NotFoundError) {
    return res.status(404).json({
      success: false,
      error: error.message,
      code: error.code
    });
  }

  if (error instanceof UnauthorizedError) {
    return res.status(401).json({
      success: false,
      error: error.message,
      code: error.code
    });
  }

  if (error instanceof DomainError) {
    return res.status(400).json({
      success: false,
      error: error.message,
      code: error.code
    });
  }

  return res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
}
