import { UnauthorizedError } from '../../../../shared/domain/errors/unauthorized.error';

export class InvalidCredentialsError extends UnauthorizedError {
  readonly code = 'INVALID_CREDENTIALS';

  constructor() {
    super('Correo o contraseña incorrectos');
  }
}
