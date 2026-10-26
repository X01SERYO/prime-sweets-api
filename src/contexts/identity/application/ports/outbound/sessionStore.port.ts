export type IssuedSession = {
  token: string;
  expiresAt: string;
  user: {
    id: string;
    email: string;
    displayName: string;
  };
};

export interface SessionStore {
  issue(user: IssuedSession['user']): Promise<IssuedSession>;
  find(token: string): Promise<IssuedSession | null>;
  revoke(token: string): Promise<void>;
}
