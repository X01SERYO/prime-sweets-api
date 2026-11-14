import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, scryptSync } from 'crypto';
import { ScryptPasswordMatcher } from '@/contexts/identity/adapters/outbound/scryptPassword.matcher';

test('ScryptPasswordMatcher accepts the matching password and rejects a bad hash', async () => {
  const salt = randomBytes(8);
  const hash = scryptSync('secret', salt, 16);
  const matcher = new ScryptPasswordMatcher();
  assert.equal(await matcher.matches('secret', `${salt.toString('hex')}.${hash.toString('hex')}`), true);
  assert.equal(await matcher.matches('secret', 'not-a-hash'), false);
  assert.equal(await matcher.matches('other', `${salt.toString('hex')}.${hash.toString('hex')}`), false);
});
