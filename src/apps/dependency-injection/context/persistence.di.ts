import { ContainerBuilder } from 'node-dependency-injection';
import { TypeOrmDataSource } from '../../../shared/infrastructure/persistence/typeorm/typeOrmDataSource';

export function registerPersistenceDependencies(container: ContainerBuilder): void {
  container.register('shared.infrastructure.persistence.typeorm.data_source', TypeOrmDataSource);
}
