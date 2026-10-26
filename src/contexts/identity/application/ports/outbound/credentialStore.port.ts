export type StoredCredential = {
  id: string;
  email: string;
  displayName: string;
  passwordHash: string;
};

export interface CredentialStore {
  findByEmail(email: string): Promise<StoredCredential | null>;
}
