import { Result } from '@shared/application/result/result';
import { CustomerPrimitives } from '@customers/domain/entities/customer';
import { CustomerRepository } from '@customers/application/ports/outbound/customer.repository';
import { CustomerNotFoundError } from '@customers/domain/errors/customerNotFound.error';
import { InvalidCustomerError } from '@customers/domain/errors/invalidCustomer.error';

export class GetCustomerUseCase {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async run(id: string): Promise<Result<CustomerPrimitives>> {
    const trimmedId = id?.trim();
    if (!trimmedId) {
      return Result.fail(new InvalidCustomerError('Customer id cannot be empty'));
    }

    const customer = await this.customerRepository.findById(trimmedId);
    if (!customer) {
      return Result.fail(new CustomerNotFoundError(trimmedId));
    }

    return Result.ok(customer.toPrimitives());
  }
}
