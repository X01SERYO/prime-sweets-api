import { IdGenerator } from '../../../../../shared/application/ports/idGenerator';
import { Result } from '../../../../../shared/application/result/result';
import { SalePrimitives } from '../../../domain/entities/sale';
import { SaleItem } from '../../../domain/entities/saleItem';
import { SaleRepository } from '../../ports/outbound/sale.repository';
import { ProductSnapshotProvider } from '../../ports/outbound/productSnapshotProvider.port';
import { AddSaleItemDto } from '../../dto/addSaleItem.dto';
import { SaleNotFoundError } from '../../../domain/errors/saleNotFound.error';
import { DeliveryDateRequiredError } from '../../../domain/errors/deliveryDateRequired.error';
import { ProductNotFoundForSaleError } from '../../../domain/errors/productNotFoundForSale.error';
import { InvalidSaleError } from '../../../domain/errors/invalidSale.error';

export class AddSaleItemUseCase {
  constructor(
    private readonly saleRepository: SaleRepository,
    private readonly productSnapshotProvider: ProductSnapshotProvider,
    private readonly ids: IdGenerator
  ) {}

  async run(dto: AddSaleItemDto): Promise<Result<SalePrimitives>> {
    if (!dto.saleId || !dto.saleId.trim()) {
      return Result.fail(new InvalidSaleError('Sale id cannot be empty'));
    }
    if (!dto.productId || !dto.productId.trim()) {
      return Result.fail(new InvalidSaleError('Product id cannot be empty'));
    }

    const sale = await this.saleRepository.findById(dto.saleId.trim());
    if (!sale) {
      return Result.fail(new SaleNotFoundError(dto.saleId));
    }

    if (!sale.deliveryDate) {
      return Result.fail(new DeliveryDateRequiredError());
    }

    const snapshot = await this.productSnapshotProvider.getSnapshot(dto.productId.trim());
    if (!snapshot) {
      return Result.fail(new ProductNotFoundForSaleError(dto.productId));
    }

    try {
      const saleItem = SaleItem.create({
        id: this.ids.next(),
        productId: snapshot.id,
        productCode: snapshot.code,
        catalogName: snapshot.name,
        itemName: dto.itemName?.trim() || snapshot.name,
        quantity: dto.quantity,
        wholesalePrice: snapshot.wholesalePrice,
        wholesaleCost: snapshot.wholesaleCost
      });

      const updatedSale = sale.addItem(saleItem);
      await this.saleRepository.save(updatedSale);

      return Result.ok(updatedSale.toPrimitives());
    } catch (err) {
      return Result.fail(err as Error);
    }
  }
}
