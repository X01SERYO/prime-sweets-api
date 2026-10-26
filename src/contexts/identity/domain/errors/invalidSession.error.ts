import { UnauthorizedError } from '../../../../shared/domain/errors/unauthorized.error';

export class InvalidSessionError extends UnauthorizedError {
  readonly code = 'INVALID_SESSION';

  constructor() {
    super('La sesión no es válida');
  }
}
