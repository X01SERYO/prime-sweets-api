import { Result } from '@/shared/application/result/result';
import { InvalidCredentialsError } from '@/contexts/identity/domain/errors/invalidCredentials.error';
import { LoginDto } from '@/contexts/identity/application/dto/login.dto';
import { CredentialStore } from '@/contexts/identity/application/ports/outbound/credentialStore.port';
import { PasswordMatcher } from '@/contexts/identity/application/ports/outbound/passwordMatcher.port';
import { IssuedSession, SessionStore } from '@/contexts/identity/application/ports/outbound/sessionStore.port';

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

    const user = stored.toPrimitives();
    const session = await this.sessions.issue({
      id: user.id,
      email: user.email,
      displayName: user.displayName
    });
    return Result.ok(session);
  }
}
