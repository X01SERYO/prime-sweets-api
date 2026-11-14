import { Result } from '@/shared/application/result/result';
import { CustomerPrimitives } from '@/contexts/customers/domain/entities/customer';
import { CustomerRepository } from '@/contexts/customers/application/ports/outbound/customer.repository';
import { SearchCustomersDto } from '@/contexts/customers/application/dto/searchCustomers.dto';

export class SearchCustomersUseCase {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async run(dto?: SearchCustomersDto): Promise<Result<CustomerPrimitives[]>> {
    const query = dto?.query?.trim();

    const customers =
      query && query.length > 0
        ? await this.customerRepository.search(query)
        : await this.customerRepository.findAll();

    return Result.ok(customers.map((customer) => customer.toPrimitives()));
  }
}
