import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { TypeOrmCustomerRepository } from '../../../contexts/customers/adapters/outbound/persistence/repositories/typeOrmCustomer.repository';
import { CreateCustomerUseCase } from '../../../contexts/customers/application/use-cases/createCustomer/createCustomer.useCase';
import { GetCustomerUseCase } from '../../../contexts/customers/application/use-cases/getCustomer/getCustomer.useCase';
import { SearchCustomersUseCase } from '../../../contexts/customers/application/use-cases/searchCustomers/searchCustomers.useCase';
import { UpdateCustomerUseCase } from '../../../contexts/customers/application/use-cases/updateCustomer/updateCustomer.useCase';

export function registerCustomerDependencies(container: ContainerBuilder): void {
  const dataSourceRef = new Reference('shared.infrastructure.persistence.typeorm.data_source');

  container
    .register('customers.domain.customer_repository', TypeOrmCustomerRepository)
    .addArgument(dataSourceRef);

  const customerRepoRef = new Reference('customers.domain.customer_repository');
  const idsRef = new Reference('shared.application.id_generator');

  container
    .register('customers.application.create_customer_use_case', CreateCustomerUseCase)
    .addArgument(customerRepoRef)
    .addArgument(idsRef);

  container
    .register('customers.application.get_customer_use_case', GetCustomerUseCase)
    .addArgument(customerRepoRef);

  container
    .register('customers.application.search_customers_use_case', SearchCustomersUseCase)
    .addArgument(customerRepoRef);

  container
    .register('customers.application.update_customer_use_case', UpdateCustomerUseCase)
    .addArgument(customerRepoRef);
}
