import { ContainerBuilder } from 'node-dependency-injection';
import { CryptoIdGenerator } from '../../../shared/infrastructure/id/cryptoIdGenerator';
import { TypeOrmDataSource } from '../../../shared/infrastructure/persistence/typeorm/typeOrmDataSource';

export function registerPersistenceDependencies(container: ContainerBuilder): void {
  container.register('shared.infrastructure.persistence.typeorm.data_source', TypeOrmDataSource);
  container.register('shared.application.id_generator', CryptoIdGenerator);
}
