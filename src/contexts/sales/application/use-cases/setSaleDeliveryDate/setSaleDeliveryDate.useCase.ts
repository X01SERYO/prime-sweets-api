import { IdGenerator } from '@/shared/application/ports/idGenerator';
import { Result } from '@/shared/application/result/result';
import { Sale, SalePrimitives } from '@/contexts/sales/domain/entities/sale';
import { SaleItem } from '@/contexts/sales/domain/entities/saleItem';
import { SaleNotFoundError } from '@/contexts/sales/domain/errors/saleNotFound.error';
import { InvalidSaleError } from '@/contexts/sales/domain/errors/invalidSale.error';
import { assertDeliveryDateAllowed } from '@/contexts/sales/domain/services/deliveryDateRange';
import { SetSaleDeliveryDateDto } from '@/contexts/sales/application/dto/setSaleDeliveryDate.dto';
import { BusinessCalendar } from '@/shared/application/ports/businessCalendar';
import { InvoiceNumberAllocator } from '@/contexts/sales/application/ports/outbound/invoiceNumberAllocator.port';
import { SaleBatch } from '@/contexts/sales/application/ports/outbound/saleBatch.port';
import { SaleRepository } from '@/contexts/sales/application/ports/outbound/sale.repository';

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

      const retired = sale.retire();
      const open = await this.openDraft(sale.customerId, deliveryDate, sale.id);
      let replacement = open ?? Sale.create({
        id: this.ids.next(),
        sellerId: sale.sellerId,
        customerId: sale.customerId,
        captureDate: sale.captureDate,
        deliveryDate
      });
      for (const item of sale.items) {
        replacement = replacement.addItem(
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
        );
      }
      await this.saleBatch.saveAll([retired, replacement]);
      return Result.ok(replacement.toPrimitives());
    } catch (error) {
      return Result.fail(error as Error);
    }
  }

  private async openDraft(customerId: string, deliveryDate: string, exceptId: string): Promise<Sale | null> {
    const drafts = await this.saleRepository.list({ customerId, deliveryDate, status: 'DRAFT' });
    return (
      drafts.find(sale => sale.id !== exceptId && sale.isDraft() && sale.customerId === customerId && sale.deliveryDate === deliveryDate) ??
      null
    );
  }

}
