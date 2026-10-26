import { Result } from '../../../../../shared/application/result/result';
import { InvalidCredentialsError } from '../../../domain/errors/invalidCredentials.error';
import { LoginDto } from '../../dto/login.dto';
import { CredentialStore } from '../../ports/outbound/credentialStore.port';
import { PasswordMatcher } from '../../ports/outbound/passwordMatcher.port';
import { IssuedSession, SessionStore } from '../../ports/outbound/sessionStore.port';

export class LoginUseCase {
  constructor(
    private readonly credentials: CredentialStore,
    private readonly passwords: PasswordMatcher,
    private readonly sessions: SessionStore
  ) {}

  async run(dto: LoginDto): Promise<Result<IssuedSession>> {
    const email = dto.email.trim().toLowerCase();
    const stored = await this.credentials.findByEmail(email);
    if (!stored || !(await this.passwords.matches(dto.password, stored.passwordHash))) {
      return Result.fail(new InvalidCredentialsError());
    }

    const session = await this.sessions.issue({
      id: stored.id,
      email: stored.email,
      displayName: stored.displayName
    });
    return Result.ok(session);
  }
}
