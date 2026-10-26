import test from 'node:test';
import assert from 'node:assert/strict';
import { User } from '../../../../../../contexts/identity/domain/entities/user';
import { InvalidUserError } from '../../../../../../contexts/identity/domain/errors/invalidUser.error';

test('User.toPrimitives omits the password hash', () => {
  const user = User.rehydrate({
    id: 'user-1',
    email: 'user@example.com',
    displayName: 'Usuario',
    passwordHash: 'hash'
  });

  assert.deepEqual(user.toPrimitives(), {
    id: 'user-1',
    email: 'user@example.com',
    displayName: 'Usuario'
  });
});

test('User.rehydrate rejects a blank email', () => {
  assert.throws(
    () =>
      User.rehydrate({
        id: 'user-1',
        email: ' ',
        displayName: 'Usuario',
        passwordHash: 'hash'
      }),
    InvalidUserError
  );
});
