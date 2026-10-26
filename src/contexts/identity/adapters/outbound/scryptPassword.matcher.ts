import { scrypt, timingSafeEqual } from 'crypto';
import { PasswordMatcher } from '../../application/ports/outbound/passwordMatcher.port';

export class ScryptPasswordMatcher implements PasswordMatcher {
  async matches(password: string, passwordHash: string): Promise<boolean> {
    const [saltHex, hashHex] = passwordHash.split('.');
    if (!saltHex || !hashHex) {
      return false;
    }
    const salt = Buffer.from(saltHex, 'hex');
    const expected = Buffer.from(hashHex, 'hex');
    const actual = await scryptAsync(password, salt, expected.length);
    if (actual.length !== expected.length) {
      return false;
    }
    return timingSafeEqual(actual, expected);
  }
}

function scryptAsync(password: string, salt: Buffer, keylen: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keylen, (error, derived) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(derived);
    });
  });
}
