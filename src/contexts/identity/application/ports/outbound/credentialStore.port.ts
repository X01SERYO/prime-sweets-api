import { User } from '../../../domain/entities/user';

export interface CredentialStore {
  findByEmail(email: string): Promise<User | null>;
}
