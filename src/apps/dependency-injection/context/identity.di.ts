import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { TypeOrmSessionStore } from '../../../contexts/identity/adapters/outbound/persistence/typeOrmSession.store';
import { TypeOrmCredentialStore } from '../../../contexts/identity/adapters/outbound/persistence/typeOrmCredential.store';
import { ScryptPasswordMatcher } from '../../../contexts/identity/adapters/outbound/scryptPassword.matcher';
import { GetSessionUseCase } from '../../../contexts/identity/application/use-cases/getSession/getSession.useCase';
import { LoginUseCase } from '../../../contexts/identity/application/use-cases/login/login.useCase';
import { LogoutUseCase } from '../../../contexts/identity/application/use-cases/logout/logout.useCase';

export function registerIdentityDependencies(container: ContainerBuilder): void {
  const dataSourceRef = new Reference('shared.infrastructure.persistence.typeorm.data_source');

  container.register('identity.infrastructure.credential_store', TypeOrmCredentialStore).addArgument(dataSourceRef);
  container.register('identity.infrastructure.password_matcher', ScryptPasswordMatcher);
  container.register('identity.infrastructure.session_store', TypeOrmSessionStore).addArgument(dataSourceRef);

  const credentials = new Reference('identity.infrastructure.credential_store');
  const passwords = new Reference('identity.infrastructure.password_matcher');
  const sessions = new Reference('identity.infrastructure.session_store');

  container
    .register('identity.application.login_use_case', LoginUseCase)
    .addArgument(credentials)
    .addArgument(passwords)
    .addArgument(sessions);

  container.register('identity.application.get_session_use_case', GetSessionUseCase).addArgument(sessions);
  container.register('identity.application.logout_use_case', LogoutUseCase).addArgument(sessions);
}
