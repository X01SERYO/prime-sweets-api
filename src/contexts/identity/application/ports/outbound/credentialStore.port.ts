import { User } from '@identity/domain/entities/user';

export interface CredentialStore {
  findByEmail(email: string): Promise<User | null>;
}
