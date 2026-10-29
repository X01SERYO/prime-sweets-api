import { randomBytes } from 'crypto';
import { DataSource, LessThanOrEqual } from 'typeorm';
import { IssuedSession, SessionStore } from '../../../application/ports/outbound/sessionStore.port';
import { MAX_OPEN_SESSIONS } from '../../../domain/sessionLimit';
import { SessionEntity } from './session.entity';

const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

export class TypeOrmSessionStore implements SessionStore {
  private readonly dataSource: DataSource;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  async issue(user: IssuedSession['user']): Promise<IssuedSession> {
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    const token = randomBytes(32).toString('hex');
    await this.dataSource.transaction(async manager => {
      const repo = manager.getRepository(SessionEntity);
      await repo.delete({ userId: user.id, expiresAt: LessThanOrEqual(new Date()) });
      const open = await repo.find({
        where: { userId: user.id },
        order: { createdAt: 'ASC' }
      });
      const overflow = open.length - (MAX_OPEN_SESSIONS - 1);
      if (overflow > 0) {
        await repo.delete(open.slice(0, overflow).map(session => session.token));
      }
      await repo.save(
        repo.create({
          token,
          userId: user.id,
          email: user.email,
          displayName: user.displayName,
          expiresAt
        })
      );
    });
    return {
      token,
      expiresAt: expiresAt.toISOString(),
      user
    };
  }

  async find(token: string): Promise<IssuedSession | null> {
    const repo = this.dataSource.getRepository(SessionEntity);
    const session = await repo.findOne({ where: { token } });
    if (!session) {
      return null;
    }
    if (session.expiresAt.getTime() <= Date.now()) {
      await repo.delete({ token });
      return null;
    }
    return {
      token: session.token,
      expiresAt: session.expiresAt.toISOString(),
      user: {
        id: session.userId,
        email: session.email,
        displayName: session.displayName
      }
    };
  }

  async revoke(token: string): Promise<void> {
    await this.dataSource.getRepository(SessionEntity).delete({ token });
  }
}
