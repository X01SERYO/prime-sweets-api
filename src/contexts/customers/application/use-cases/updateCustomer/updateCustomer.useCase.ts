import { Result } from '../../../../../shared/application/result/result';
import { CustomerPrimitives } from '../../../domain/entities/customer';
import { CustomerRepository } from '../../ports/outbound/customer.repository';
import { CustomerNotFoundError } from '../../../domain/errors/customerNotFound.error';
import { CustomerAlreadyExistsError } from '../../../domain/errors/customerAlreadyExists.error';
import { InvalidCustomerError } from '../../../domain/errors/invalidCustomer.error';
import { UpdateCustomerDto } from '../../dto/updateCustomer.dto';

export class UpdateCustomerUseCase {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async run(dto: UpdateCustomerDto): Promise<Result<CustomerPrimitives>> {
    const trimmedId = dto.id?.trim();
    if (!trimmedId) {
      return Result.fail(new InvalidCustomerError('Customer id cannot be empty'));
    }

    const customer = await this.customerRepository.findById(trimmedId);
    if (!customer) {
      return Result.fail(new CustomerNotFoundError(trimmedId));
    }

    if (dto.name !== undefined && (!dto.name || dto.name.trim() === '')) {
      return Result.fail(new InvalidCustomerError('Customer name cannot be empty'));
    }

    const targetDocType = dto.documentType !== undefined ? dto.documentType.trim() : customer.documentType;
    const targetDocNumber = dto.documentNumber !== undefined ? dto.documentNumber.trim() : customer.documentNumber;

    if (!targetDocType) {
      return Result.fail(new InvalidCustomerError('Customer document type cannot be empty'));
    }
    if (!targetDocNumber) {
      return Result.fail(new InvalidCustomerError('Customer document number cannot be empty'));
    }

    if (targetDocType !== customer.documentType || targetDocNumber !== customer.documentNumber) {
      const existing = await this.customerRepository.findByDocument(targetDocType, targetDocNumber);
      if (existing && existing.id !== customer.id) {
        return Result.fail(new CustomerAlreadyExistsError(targetDocNumber));
      }
    }

    try {
      const updated = customer.update({
        documentType: dto.documentType,
        documentNumber: dto.documentNumber,
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        address: dto.address
      });

      await this.customerRepository.save(updated);

      return Result.ok(updated.toPrimitives());
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error('Failed to update customer'));
    }
  }
}
