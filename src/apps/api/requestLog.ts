import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { log, LogLevel } from '@/shared/infrastructure/logging/logger';

export function requestLog(req: Request, res: Response, next: NextFunction): void {
  if (req.method === 'OPTIONS') {
    next();
    return;
  }
  const requestId = randomUUID();
  const started = Date.now();
  const path = req.originalUrl.split('?')[0] ?? req.path;
  log('info', 'http.request.start', {
    requestId,
    method: req.method,
    path
  });
  res.on('finish', () => {
    const status = res.statusCode;
    const level: LogLevel = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';
    const failure = res.locals.failure;
    log(level, 'http.request.end', {
      requestId,
      method: req.method,
      path,
      query: req.originalUrl.includes('?') ? req.originalUrl.slice(req.originalUrl.indexOf('?')) : null,
      status,
      durationMs: Date.now() - started,
      ...(status >= 400 ? describeFailure(failure) : {})
    });
  });
  next();
}

function describeFailure(failure: unknown): Record<string, string | number | boolean | null> {
  if (!(failure instanceof Error)) {
    return { errorMessage: failure == null ? null : String(failure) };
  }
  const extra = failure as Error & {
    code?: unknown;
    constraint?: unknown;
    detail?: unknown;
    table?: unknown;
    driverError?: { code?: unknown; constraint?: unknown; detail?: unknown; table?: unknown };
  };
  const driver = extra.driverError;
  return {
    errorName: failure.name,
    errorMessage: failure.message,
    errorCode: text(extra.code) ?? text(driver?.code),
    constraint: text(extra.constraint) ?? text(driver?.constraint),
    detail: text(extra.detail) ?? text(driver?.detail),
    table: text(extra.table) ?? text(driver?.table),
    stack: failure.stack ?? null
  };
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value ? value : null;
}
