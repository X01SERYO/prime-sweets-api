import { Customer } from '../../../domain/entities/customer';

export interface CustomerRepository {
  findById(id: string): Promise<Customer | null>;
  findByDocument(documentType: string, documentNumber: string): Promise<Customer | null>;
  search(term: string): Promise<Customer[]>;
  findAll(): Promise<Customer[]>;
  save(customer: Customer): Promise<void>;
}
