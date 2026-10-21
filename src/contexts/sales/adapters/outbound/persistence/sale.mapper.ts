import { Sale, SaleStatus } from '../../../domain/entities/sale';
import { InvalidSaleError } from '../../../domain/errors/invalidSale.error';
import { SaleItem } from '../../../domain/entities/saleItem';
import { SaleEntity } from './sale.entity';
import { SaleItemEntity } from './saleItem.entity';

function toSaleStatus(status: string): SaleStatus {
  if (status === 'DRAFT' || status === 'CONFIRMED' || status === 'VOIDED') {
    return status;
  }

  throw new InvalidSaleError(`Unknown sale status: ${status}`);
}

export class SaleMapper {
  static toDomain(entity: SaleEntity): Sale {
    const items = (entity.items ?? []).map((itemEntity) =>
      SaleItem.create({
        id: itemEntity.id,
        productId: itemEntity.productId,
        itemName: itemEntity.itemName,
        quantity: itemEntity.quantity,
        wholesalePrice: Number(itemEntity.wholesalePrice),
        wholesaleCost: Number(itemEntity.wholesaleCost)
      })
    );

    return Sale.create({
      id: entity.id,
      salesDayId: entity.salesDayId,
      customerId: entity.customerId,
      status: toSaleStatus(entity.status),
      invoiceNumber: entity.invoiceNumber,
      invoiceBusinessDate: entity.invoiceBusinessDate,
      items,
      createdAt: entity.createdAt,
      confirmedAt: entity.confirmedAt,
      voidedAt: entity.voidedAt
    });
  }

  static toEntity(sale: Sale): SaleEntity {
    const primitives = sale.toPrimitives();

    const entity = new SaleEntity();
    entity.id = primitives.id;
    entity.salesDayId = primitives.salesDayId;
    entity.customerId = primitives.customerId;
    entity.status = primitives.status;
    entity.invoiceNumber = primitives.invoiceNumber;
    entity.invoiceBusinessDate = primitives.invoiceBusinessDate;
    entity.totalAmount = primitives.totalAmount;
    entity.totalProfit = primitives.totalProfit;
    entity.totalQuantity = primitives.totalQuantity;
    entity.confirmedAt = primitives.confirmedAt ? new Date(primitives.confirmedAt) : null;
    entity.voidedAt = primitives.voidedAt ? new Date(primitives.voidedAt) : null;
    entity.createdAt = new Date(primitives.createdAt);

    entity.items = primitives.items.map((item) => {
      const itemEntity = new SaleItemEntity();
      itemEntity.id = item.id;
      itemEntity.saleId = primitives.id;
      itemEntity.productId = item.productId;
      itemEntity.itemName = item.itemName;
      itemEntity.quantity = item.quantity;
      itemEntity.wholesalePrice = item.wholesalePrice;
      itemEntity.wholesaleCost = item.wholesaleCost;
      itemEntity.totalPrice = item.totalPrice;
      itemEntity.profit = item.profit;
      return itemEntity;
    });

    return entity;
  }
}
