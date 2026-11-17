import { Result } from '@/shared/application/result/result';
import { SalePrimitives } from '@/contexts/sales/domain/entities/sale';
import { SaleNotFoundError } from '@/contexts/sales/domain/errors/saleNotFound.error';
import { InvalidSaleError } from '@/contexts/sales/domain/errors/invalidSale.error';
import { CustomerNotFoundForSaleError } from '@/contexts/sales/domain/errors/customerNotFoundForSale.error';
import { AssignSaleCustomerDto } from '@/contexts/sales/application/dto/assignSaleCustomer.dto';
import { CustomerChecker } from '@/contexts/sales/application/ports/outbound/customerChecker.port';
import { SaleRepository } from '@/contexts/sales/application/ports/outbound/sale.repository';

export class AssignSaleCustomerUseCase {
  constructor(
    private readonly saleRepository: SaleRepository,
    private readonly customerChecker: CustomerChecker
  ) {}

  async run(dto: AssignSaleCustomerDto): Promise<Result<SalePrimitives>> {
    const saleId = dto.saleId?.trim();
    const customerId = dto.customerId?.trim();
    if (!saleId || !customerId) {
      return Result.fail(new InvalidSaleError('Sale id and customer id are required'));
    }

    const sale = await this.saleRepository.findById(saleId);
    if (!sale) {
      return Result.fail(new SaleNotFoundError(saleId));
    }

    const customerExists = await this.customerChecker.customerExists(customerId);
    if (!customerExists) {
      return Result.fail(new CustomerNotFoundForSaleError(customerId));
    }

    try {
      const updated = sale.changeCustomer(customerId);
      if (updated !== sale) {
        await this.saleRepository.save(updated);
      }
      return Result.ok(updated.toPrimitives());
    } catch (error) {
      return Result.fail(error as Error);
    }
  }
}
