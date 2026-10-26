import { Result } from '../../../../../shared/application/result/result';
import { SessionStore } from '../../ports/outbound/sessionStore.port';

export class LogoutUseCase {
  constructor(private readonly sessions: SessionStore) {}

  async run(token: string | undefined): Promise<Result<null>> {
    if (token) {
      await this.sessions.revoke(token);
    }
    return Result.ok(null);
  }
}
