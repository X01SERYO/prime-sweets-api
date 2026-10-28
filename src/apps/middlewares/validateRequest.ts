import { Request, Response, NextFunction } from 'express';
import { ZodType, ZodError } from 'zod';

export interface RequestValidationSchema {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}

function assignRequestField(req: Request, field: 'query' | 'params', value: unknown): void {
  try {
    (req as unknown as Record<string, unknown>)[field] = value;
  } catch {
    Object.defineProperty(req, field, {
      value,
      writable: true,
      configurable: true,
      enumerable: true
    });
  }
}

export function validateRequest(schema: RequestValidationSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (schema.params) {
        assignRequestField(req, 'params', schema.params.parse(req.params));
      }
      if (schema.query) {
        assignRequestField(req, 'query', schema.query.parse(req.query));
      }
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          code: 'INVALID_REQUEST_PAYLOAD',
          details: error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        });
        return;
      }
      next(error);
    }
  };
}
