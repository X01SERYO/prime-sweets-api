import { User } from '@/contexts/identity/domain/entities/user';

export interface CredentialStore {
  findByEmail(email: string): Promise<User | null>;
}
