import { randomUUID } from 'crypto';
import { Result } from '../../../../../shared/application/result/result';
import { Customer, CustomerPrimitives } from '../../../domain/entities/customer';
import { CustomerRepository } from '../../ports/outbound/customer.repository';
import { CustomerAlreadyExistsError } from '../../../domain/errors/customerAlreadyExists.error';
import { InvalidCustomerError } from '../../../domain/errors/invalidCustomer.error';
import { CreateCustomerDto } from '../../dto/createCustomer.dto';

export class CreateCustomerUseCase {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async run(dto: CreateCustomerDto): Promise<Result<CustomerPrimitives>> {
    if (!dto.documentType || !dto.documentType.trim()) {
      return Result.fail(new InvalidCustomerError('Customer document type cannot be empty'));
    }
    if (!dto.documentNumber || !dto.documentNumber.trim()) {
      return Result.fail(new InvalidCustomerError('Customer document number cannot be empty'));
    }
    if (!dto.name || !dto.name.trim()) {
      return Result.fail(new InvalidCustomerError('Customer name cannot be empty'));
    }

    const docType = dto.documentType.trim();
    const docNumber = dto.documentNumber.trim();

    const existing = await this.customerRepository.findByDocument(docType, docNumber);
    if (existing) {
      return Result.fail(new CustomerAlreadyExistsError(docNumber));
    }

    const customer = Customer.create({
      id: randomUUID(),
      documentType: docType,
      documentNumber: docNumber,
      name: dto.name.trim(),
      phone: dto.phone,
      email: dto.email,
      address: dto.address
    });

    try {
      await this.customerRepository.save(customer);
    } catch (error) {
      if (error instanceof CustomerAlreadyExistsError) {
        return Result.fail(error);
      }
      throw error;
    }

    return Result.ok(customer.toPrimitives());
  }
}
