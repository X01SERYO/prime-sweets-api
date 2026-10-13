import { CustomerRepository } from '../../../customers/application/ports/outbound/customer.repository';
import { CustomerChecker } from '../../application/ports/outbound/customerChecker.port';

export class CustomerCheckerAdapter implements CustomerChecker {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async customerExists(customerId: string): Promise<boolean> {
    const customer = await this.customerRepository.findById(customerId);
    return customer !== null;
  }
}
