import { Request } from 'express';

export function bearerToken(req: Request): string | undefined {
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
