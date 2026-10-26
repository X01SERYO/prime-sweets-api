export interface PasswordMatcher {
  matches(password: string, passwordHash: string): Promise<boolean>;
}
