import { DataSource } from 'typeorm';
import { CredentialStore, StoredCredential } from '../../../application/ports/outbound/credentialStore.port';
import { UserEntity } from './user.entity';

export class TypeOrmCredentialStore implements CredentialStore {
  constructor(private readonly dataSource: DataSource) {}

  async findByEmail(email: string): Promise<StoredCredential | null> {
    const entity = await this.dataSource.getRepository(UserEntity).findOne({
      where: { email: email.trim().toLowerCase() }
    });
    if (!entity) {
      return null;
    }
    return {
      id: entity.id,
      email: entity.email,
      displayName: entity.displayName,
      passwordHash: entity.passwordHash
    };
  }
}
