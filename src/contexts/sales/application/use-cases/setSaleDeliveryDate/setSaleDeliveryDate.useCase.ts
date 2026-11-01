import { IdGenerator } from '../../../../../shared/application/ports/idGenerator';
import { Result } from '../../../../../shared/application/result/result';
import { Sale, SalePrimitives } from '../../../domain/entities/sale';
import { SaleItem } from '../../../domain/entities/saleItem';
import { SaleNotFoundError } from '../../../domain/errors/saleNotFound.error';
import { InvalidSaleError } from '../../../domain/errors/invalidSale.error';
import { assertDeliveryDateAllowed, normalizeBusinessDate } from '../../../domain/services/deliveryDateRange';
import { SetSaleDeliveryDateDto } from '../../dto/setSaleDeliveryDate.dto';
import { BusinessCalendar } from '../../ports/outbound/businessCalendar.port';
import { InvoiceNumberAllocator } from '../../ports/outbound/invoiceNumberAllocator.port';
import { SaleBatch } from '../../ports/outbound/saleBatch.port';
import { SaleRepository } from '../../ports/outbound/sale.repository';

export class SetSaleDeliveryDateUseCase {
  constructor(
    private readonly saleRepository: SaleRepository,
    private readonly saleBatch: SaleBatch,
    private readonly calendar: BusinessCalendar,
    private readonly invoiceNumberAllocator: InvoiceNumberAllocator,
    private readonly ids: IdGenerator
  ) {}

  async run(dto: SetSaleDeliveryDateDto): Promise<Result<SalePrimitives>> {
    if (!dto.saleId || !dto.saleId.trim()) {
      return Result.fail(new InvalidSaleError('Sale id cannot be empty'));
    }

    const sale = await this.saleRepository.findById(dto.saleId.trim());
    if (!sale) {
      return Result.fail(new SaleNotFoundError(dto.saleId));
    }

    try {
      if (sale.isVoided()) {
        sale.void();
      }

      const today = this.calendar.today();
      const deliveryDate = assertDeliveryDateAllowed(dto.deliveryDate, today);
      if (deliveryDate === sale.deliveryDate) {
        return Result.ok(sale.toPrimitives());
      }

      if (!sale.isConfirmed()) {
        const updated = sale.setDeliveryDate(deliveryDate, today);
        await this.saleRepository.save(updated);
        return Result.ok(updated.toPrimitives());
      }

      const replacement = this.confirmedReplacement(sale, deliveryDate);
      const invoiceNumber = await this.invoiceNumberAllocator.allocateNext(deliveryDate);
      const confirmed = replacement.confirm(invoiceNumber, normalizeBusinessDate(today));
      await this.saleBatch.saveAll([sale.void(), confirmed]);
      return Result.ok(confirmed.toPrimitives());
    } catch (error) {
      return Result.fail(error as Error);
    }
  }

  private confirmedReplacement(sale: Sale, deliveryDate: string): Sale {
    return Sale.create({
      id: this.ids.next(),
      sellerId: sale.sellerId,
      customerId: sale.customerId,
      captureDate: sale.captureDate,
      deliveryDate,
      items: sale.items.map(item =>
        SaleItem.create({
          id: this.ids.next(),
          productId: item.productId,
          productCode: item.productCode,
          catalogName: item.catalogName,
          itemName: item.itemName,
          quantity: item.quantity,
          wholesalePrice: item.wholesalePrice,
          wholesaleCost: item.wholesaleCost,
          createdAt: item.createdAt
        })
      ),
      createdAt: new Date()
    });
  }
}
