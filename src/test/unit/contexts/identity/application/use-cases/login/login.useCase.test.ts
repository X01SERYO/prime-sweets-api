import test from 'node:test';
import assert from 'node:assert/strict';
import { InMemorySessionStore } from '../../../../../../../contexts/identity/adapters/outbound/inMemorySession.store';
import { User } from '../../../../../../../contexts/identity/domain/entities/user';
import { CredentialStore } from '../../../../../../../contexts/identity/application/ports/outbound/credentialStore.port';
import { PasswordMatcher } from '../../../../../../../contexts/identity/application/ports/outbound/passwordMatcher.port';
import { LoginUseCase } from '../../../../../../../contexts/identity/application/use-cases/login/login.useCase';
import { InvalidCredentialsError } from '../../../../../../../contexts/identity/domain/errors/invalidCredentials.error';

const credentials: CredentialStore = {
  async findByEmail(email: string) {
    if (email.trim().toLowerCase() !== 'user@example.com') {
      return null;
    }
    return User.rehydrate({
      id: 'user-1',
      email: 'user@example.com',
      displayName: 'Usuario de prueba',
      passwordHash: 'hash-de-prueba'
    });
  }
};

const passwords: PasswordMatcher = {
  async matches(password: string, passwordHash: string) {
    return password === 'clave-de-prueba' && passwordHash === 'hash-de-prueba';
  }
};

test('LoginUseCase accepts a matching password from the credential store', async () => {
  const useCase = new LoginUseCase(credentials, passwords, new InMemorySessionStore());
  const result = await useCase.run({ email: 'user@example.com', password: 'clave-de-prueba' });

  assert.equal(result.isSuccess, true);
  assert.equal(result.value?.user.displayName, 'Usuario de prueba');
  assert.ok(result.value?.token);
});

test('LoginUseCase rejects an unknown password', async () => {
  const useCase = new LoginUseCase(credentials, passwords, new InMemorySessionStore());
  const result = await useCase.run({ email: 'user@example.com', password: 'otra' });

  assert.equal(result.isSuccess, false);
  assert.ok(result.error instanceof InvalidCredentialsError);
});
