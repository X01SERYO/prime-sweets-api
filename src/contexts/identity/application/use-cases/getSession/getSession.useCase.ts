import { Result } from '../../../../../shared/application/result/result';
import { InvalidSessionError } from '../../../domain/errors/invalidSession.error';
import { IssuedSession, SessionStore } from '../../ports/outbound/sessionStore.port';

export class GetSessionUseCase {
  constructor(private readonly sessions: SessionStore) {}

  async run(token: string | undefined): Promise<Result<IssuedSession>> {
    if (!token) {
      return Result.fail(new InvalidSessionError());
    }
    const session = await this.sessions.find(token);
    if (!session) {
      return Result.fail(new InvalidSessionError());
    }
    return Result.ok(session);
  }
}
