import { CustomerRepository } from '../../../customers/application/ports/outbound/customer.repository';
import { InvoiceCustomerQuery } from '../../application/ports/outbound/invoiceCustomerQuery.port';
import { InvoiceCustomerView } from '../../domain/entities/invoiceDocument';

export class InvoiceCustomerAdapter implements InvoiceCustomerQuery {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async findById(customerId: string): Promise<InvoiceCustomerView | null> {
    const customer = await this.customerRepository.findById(customerId);
    if (!customer) {
      return null;
    }

    const primitives = customer.toPrimitives();
    return {
      documentType: primitives.documentType,
      documentNumber: primitives.documentNumber,
      name: primitives.name
    };
  }
}
