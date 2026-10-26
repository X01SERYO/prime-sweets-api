import { randomBytes } from 'crypto';
import { IssuedSession, SessionStore } from '../../application/ports/outbound/sessionStore.port';

const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

export class InMemorySessionStore implements SessionStore {
  private readonly sessions = new Map<string, IssuedSession>();

  async issue(user: IssuedSession['user']): Promise<IssuedSession> {
    const session: IssuedSession = {
      token: randomBytes(32).toString('hex'),
      expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
      user
    };
    this.sessions.set(session.token, session);
    return session;
  }

  async find(token: string): Promise<IssuedSession | null> {
    const session = this.sessions.get(token);
    if (!session) {
      return null;
    }
    if (Date.parse(session.expiresAt) <= Date.now()) {
      this.sessions.delete(token);
      return null;
    }
    return session;
  }

  async revoke(token: string): Promise<void> {
    this.sessions.delete(token);
  }
}
