import { randomUUID } from 'crypto';
import { IdGenerator } from '../../application/ports/idGenerator';

export class CryptoIdGenerator implements IdGenerator {
  next(): string {
    return randomUUID();
  }
}
