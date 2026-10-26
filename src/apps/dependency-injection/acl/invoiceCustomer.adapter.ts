import { CustomerRepository } from '../../../contexts/customers/application/ports/outbound/customer.repository';
import { InvoiceCustomerQuery } from '../../../contexts/fulfillment-output/application/ports/outbound/invoiceCustomerQuery.port';
import { InvoiceCustomerView } from '../../../contexts/fulfillment-output/domain/entities/invoiceDocument';

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
