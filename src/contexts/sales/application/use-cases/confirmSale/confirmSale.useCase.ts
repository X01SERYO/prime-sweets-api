import { Result } from '../../../../../shared/application/result/result';
import { SalePrimitives } from '../../../domain/entities/sale';
import { SaleRepository } from '../../ports/outbound/sale.repository';
import { BusinessCalendar } from '../../ports/outbound/businessCalendar.port';
import { InvoiceNumberAllocator } from '../../ports/outbound/invoiceNumberAllocator.port';
import { ConfirmSaleDto } from '../../dto/confirmSale.dto';
import { SaleNotFoundError } from '../../../domain/errors/saleNotFound.error';
import { SaleCannotBeModifiedError } from '../../../domain/errors/saleCannotBeModified.error';
import { InvalidSaleError } from '../../../domain/errors/invalidSale.error';

export class ConfirmSaleUseCase {
  constructor(
    private readonly saleRepository: SaleRepository,
    private readonly calendar: BusinessCalendar,
    private readonly invoiceNumberAllocator: InvoiceNumberAllocator
  ) {}

  async run(dto: ConfirmSaleDto): Promise<Result<SalePrimitives>> {
    if (!dto.saleId || !dto.saleId.trim()) {
      return Result.fail(new InvalidSaleError('Sale id cannot be empty'));
    }

    const sale = await this.saleRepository.findById(dto.saleId.trim());
    if (!sale) {
      return Result.fail(new SaleNotFoundError(dto.saleId));
    }

    if (sale.isConfirmed()) {
      return Result.fail(new SaleCannotBeModifiedError('Sale is already confirmed'));
    }

    try {
      const businessDate = this.calendar.today();
      const invoiceNumber = await this.invoiceNumberAllocator.allocateNext(businessDate);
      const confirmed = sale.confirm(invoiceNumber, businessDate);
      await this.saleRepository.save(confirmed);

      return Result.ok(confirmed.toPrimitives());
    } catch (err) {
      return Result.fail(err as Error);
    }
  }
}
