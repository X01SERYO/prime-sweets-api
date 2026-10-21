import { DataSource } from 'typeorm';
import { Customer } from '../../../../domain/entities/customer';
import { CustomerAlreadyExistsError } from '../../../../domain/errors/customerAlreadyExists.error';
import { CustomerRepository } from '../../../../application/ports/outbound/customer.repository';
import { CustomerEntity } from '../customer.entity';
import { isUniqueCustomerDocumentViolation } from './customerDocumentConflict';

export class TypeOrmCustomerRepository implements CustomerRepository {
  constructor(private readonly dataSource: DataSource) {}

  private get repo() {
    return this.dataSource.getRepository(CustomerEntity);
  }

  async findById(id: string): Promise<Customer | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByDocument(documentType: string, documentNumber: string): Promise<Customer | null> {
    const entity = await this.repo
      .createQueryBuilder('customer')
      .where('LOWER(customer.document_type) = LOWER(:documentType)', { documentType })
      .andWhere('customer.document_number = :documentNumber', { documentNumber })
      .getOne();

    return entity ? this.toDomain(entity) : null;
  }

  async search(term: string): Promise<Customer[]> {
    const sanitized = term.trim();
    if (!sanitized) {
      return this.findAll();
    }

    const pattern = `%${sanitized}%`;
    const entities = await this.repo
      .createQueryBuilder('customer')
      .where('customer.name ILIKE :pattern', { pattern })
      .orWhere('customer.document_number ILIKE :pattern', { pattern })
      .orderBy('customer.name', 'ASC')
      .getMany();

    return entities.map((entity) => this.toDomain(entity));
  }

  async findAll(): Promise<Customer[]> {
    const entities = await this.repo.find({ order: { name: 'ASC' } });
    return entities.map((entity) => this.toDomain(entity));
  }

  async save(customer: Customer): Promise<void> {
    try {
      await this.repo.save({
        id: customer.id,
        documentType: customer.documentType,
        documentNumber: customer.documentNumber,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address
      });
    } catch (error) {
      if (isUniqueCustomerDocumentViolation(error)) {
        throw new CustomerAlreadyExistsError(customer.documentNumber);
      }
      throw error;
    }
  }

  private toDomain(entity: CustomerEntity): Customer {
    return Customer.create({
      id: entity.id,
      documentType: entity.documentType,
      documentNumber: entity.documentNumber,
      name: entity.name,
      phone: entity.phone,
      email: entity.email,
      address: entity.address
    });
  }
}
