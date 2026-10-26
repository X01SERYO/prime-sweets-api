import { IdGenerator } from '../../../../../shared/application/ports/idGenerator';
import { Result } from '../../../../../shared/application/result/result';
import { Sale, SalePrimitives } from '../../../domain/entities/sale';
import { SaleItem } from '../../../domain/entities/saleItem';
import { SaleRepository } from '../../ports/outbound/sale.repository';
import { SalesDayStatusChecker } from '../../ports/outbound/salesDayStatusChecker.port';
import { CustomerChecker } from '../../ports/outbound/customerChecker.port';
import { ProductSnapshotProvider } from '../../ports/outbound/productSnapshotProvider.port';
import { CreateSaleDto } from '../../dto/createSale.dto';
import { SalesDayNotOpenForSaleError } from '../../../domain/errors/salesDayNotOpenForSale.error';
import { CustomerNotFoundForSaleError } from '../../../domain/errors/customerNotFoundForSale.error';
import { ProductNotFoundForSaleError } from '../../../domain/errors/productNotFoundForSale.error';
import { InvalidSaleError } from '../../../domain/errors/invalidSale.error';

export class CreateSaleUseCase {
  constructor(
    private readonly saleRepository: SaleRepository,
    private readonly salesDayStatusChecker: SalesDayStatusChecker,
    private readonly customerChecker: CustomerChecker,
    private readonly productSnapshotProvider: ProductSnapshotProvider,
    private readonly ids: IdGenerator
  ) {}

  async run(dto: CreateSaleDto): Promise<Result<SalePrimitives>> {
    if (!dto.salesDayId || !dto.salesDayId.trim()) {
      return Result.fail(new InvalidSaleError('Sales day id cannot be empty'));
    }
    if (!dto.customerId || !dto.customerId.trim()) {
      return Result.fail(new InvalidSaleError('Customer id cannot be empty'));
    }

    const salesDayOpen = await this.salesDayStatusChecker.isSalesDayOpen(dto.salesDayId);
    if (!salesDayOpen) {
      return Result.fail(new SalesDayNotOpenForSaleError(dto.salesDayId));
    }

    const customerExists = await this.customerChecker.customerExists(dto.customerId);
    if (!customerExists) {
      return Result.fail(new CustomerNotFoundForSaleError(dto.customerId));
    }

    let sale = Sale.create({
      id: this.ids.next(),
      salesDayId: dto.salesDayId.trim(),
      customerId: dto.customerId.trim()
    });

    if (dto.items && dto.items.length > 0) {
      for (const itemDto of dto.items) {
        const snapshot = await this.productSnapshotProvider.getSnapshot(itemDto.productId);
        if (!snapshot) {
          return Result.fail(new ProductNotFoundForSaleError(itemDto.productId));
        }

        const saleItem = SaleItem.create({
          id: this.ids.next(),
          productId: snapshot.id,
          itemName: itemDto.itemName?.trim() || snapshot.name,
          quantity: itemDto.quantity,
          wholesalePrice: snapshot.wholesalePrice,
          wholesaleCost: snapshot.wholesaleCost
        });

        sale = sale.addItem(saleItem);
      }
    }

    await this.saleRepository.save(sale);

    return Result.ok(sale.toPrimitives());
  }
}
