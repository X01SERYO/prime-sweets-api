import test from 'node:test';
import assert from 'node:assert/strict';
import { User } from '../../../../../../contexts/identity/domain/entities/user';
import { InvalidUserError } from '../../../../../../contexts/identity/domain/errors/invalidUser.error';

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
