import { DataSource } from 'typeorm';
import { User } from '../../../domain/entities/user';
import { CredentialStore } from '../../../application/ports/outbound/credentialStore.port';
import { UserEntity } from './user.entity';

export class TypeOrmCredentialStore implements CredentialStore {
  constructor(private readonly dataSource: DataSource) {}

  async findByEmail(email: string): Promise<User | null> {
    const entity = await this.dataSource.getRepository(UserEntity).findOne({
      where: { email: email.trim().toLowerCase() }
    });
    if (!entity) {
      return null;
    }
    return User.rehydrate({
      id: entity.id,
      email: entity.email,
      displayName: entity.displayName,
      passwordHash: entity.passwordHash
    });
  }
}
