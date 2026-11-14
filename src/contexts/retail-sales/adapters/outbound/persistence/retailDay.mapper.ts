import { RetailDay, RetailDayStatus } from '@/contexts/retail-sales/domain/entities/retailDay';
import { RetailDayItem } from '@/contexts/retail-sales/domain/entities/retailDayItem';
import { RetailDayEntity, StoredRetailItem } from './retailDay.entity';

export class RetailDayMapper {
  static toEntity(day: RetailDay): RetailDayEntity {
    const entity = new RetailDayEntity();
    entity.id = day.id;
    entity.businessDate = day.businessDate;
    entity.status = day.status;
    entity.totalAmount = day.totalAmount.toFixed(2);
    entity.totalProfit = day.totalProfit.toFixed(2);
    entity.openItems = day.items.length === 0 ? null : day.items.map(toStoredItem);
    entity.reviewedAt = day.reviewedAt;
    entity.reviewedBy = day.reviewedBy;
    return entity;
  }

  static toDomain(entity: RetailDayEntity): RetailDay {
    const items = (entity.openItems ?? []).map((item) =>
      RetailDayItem.fromSnapshot(
        {
          productId: item.productId,
          productCode: item.productCode,
          brandName: item.brandName,
          productName: item.productName,
          retailPrice: Number(item.retailPrice),
          retailCost: item.retailCost === null ? null : Number(item.retailCost),
        },
        item.quantity
      )
    );

    return RetailDay.rehydrate({
      id: entity.id,
      businessDate: normalizeDate(entity.businessDate),
      status: entity.status as RetailDayStatus,
      items,
      totalAmount: Number(entity.totalAmount),
      totalProfit: Number(entity.totalProfit),
      reviewedAt: entity.reviewedAt,
      reviewedBy: entity.reviewedBy,
    });
  }
}

function toStoredItem(item: RetailDayItem): StoredRetailItem {
  return {
    productId: item.productId,
    productCode: item.productCode,
    brandName: item.brandName,
    productName: item.productName,
    retailPrice: item.retailPrice,
    retailCost: item.retailCost,
    quantity: item.quantity,
  };
}

function normalizeDate(value: string | Date): string {
  if (typeof value === 'string') {
    return value.slice(0, 10);
  }
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${value.getFullYear()}-${month}-${day}`;
}
