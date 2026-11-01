import { IdGenerator } from '../../../../../shared/application/ports/idGenerator';
import { Result } from '../../../../../shared/application/result/result';
import { Sale, SalePrimitives } from '../../../domain/entities/sale';
import { SaleItem } from '../../../domain/entities/saleItem';
import { SaleRepository } from '../../ports/outbound/sale.repository';
import { BusinessCalendar } from '../../ports/outbound/businessCalendar.port';
import { CustomerChecker } from '../../ports/outbound/customerChecker.port';
import { ProductSnapshotProvider } from '../../ports/outbound/productSnapshotProvider.port';
import { CreateSaleDto } from '../../dto/createSale.dto';
import { DeliveryDateRequiredError } from '../../../domain/errors/deliveryDateRequired.error';
import { CustomerNotFoundForSaleError } from '../../../domain/errors/customerNotFoundForSale.error';
import { ProductNotFoundForSaleError } from '../../../domain/errors/productNotFoundForSale.error';
import { InvalidSaleError } from '../../../domain/errors/invalidSale.error';

export class CreateSaleUseCase {
  constructor(
    private readonly saleRepository: SaleRepository,
    private readonly customerChecker: CustomerChecker,
    private readonly productSnapshotProvider: ProductSnapshotProvider,
    private readonly calendar: BusinessCalendar,
    private readonly ids: IdGenerator
  ) {}

  async run(dto: CreateSaleDto): Promise<Result<SalePrimitives>> {
    if (!dto.sellerId || !dto.sellerId.trim()) {
      return Result.fail(new InvalidSaleError('Seller id cannot be empty'));
    }
    if (!dto.customerId || !dto.customerId.trim()) {
      return Result.fail(new InvalidSaleError('Customer id cannot be empty'));
    }
    if (!dto.deliveryDate || !dto.deliveryDate.trim()) {
      return Result.fail(new DeliveryDateRequiredError());
    }

    const customerExists = await this.customerChecker.customerExists(dto.customerId);
    if (!customerExists) {
      return Result.fail(new CustomerNotFoundForSaleError(dto.customerId));
    }

    try {
      let sale = Sale.start({
        id: this.ids.next(),
        sellerId: dto.sellerId,
        customerId: dto.customerId,
        deliveryDate: dto.deliveryDate,
        today: this.calendar.today()
      });

      for (const itemDto of dto.items ?? []) {
        const snapshot = await this.productSnapshotProvider.getSnapshot(itemDto.productId);
        if (!snapshot) {
          return Result.fail(new ProductNotFoundForSaleError(itemDto.productId));
        }

        sale = sale.addItem(
          SaleItem.create({
            id: this.ids.next(),
            productId: snapshot.id,
            productCode: snapshot.code,
            catalogName: snapshot.name,
            itemName: itemDto.itemName?.trim() || snapshot.name,
            quantity: itemDto.quantity,
            wholesalePrice: snapshot.wholesalePrice,
            wholesaleCost: snapshot.wholesaleCost
          })
        );
      }

      await this.saleRepository.save(sale);
      return Result.ok(sale.toPrimitives());
    } catch (error) {
      return Result.fail(error as Error);
    }
  }
}
