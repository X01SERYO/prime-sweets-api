import test from 'node:test';
import assert from 'node:assert/strict';
import { requireSession } from '@/apps/middlewares/requireSession';
import { Result } from '@/shared/application/result/result';
import { InvalidCredentialsError } from '@/contexts/identity/domain/errors/invalidCredentials.error';
import { AppContainer } from '@/apps/dependency-injection/appContainer';

function response() {
  const state: { status?: number } = {};
  return {
    state,
    res: {
      locals: {} as { session?: unknown },
      status(code: number) {
        state.status = code;
        return this;
      },
      json() {
        return this;
      }
    }
  };
}

test('requireSession stores the session and stops when the token is rejected', async () => {
  const accepted = response();
  let next = false;
  await requireSession({
    get: () => ({ run: async () => Result.ok({ user: { id: 'u1' } }) })
  } as unknown as AppContainer)({ header: () => 'Bearer token' } as never, accepted.res as never, () => {
    next = true;
  });
  assert.equal(next, true);
  assert.equal((accepted.res.locals.session as { user: { id: string } }).user.id, 'u1');

  const rejected = response();
  await requireSession({
    get: () => ({ run: async () => Result.fail(new InvalidCredentialsError()) })
  } as unknown as AppContainer)({ header: () => undefined } as never, rejected.res as never, () => undefined);
  assert.equal(rejected.state.status, 401);
});
