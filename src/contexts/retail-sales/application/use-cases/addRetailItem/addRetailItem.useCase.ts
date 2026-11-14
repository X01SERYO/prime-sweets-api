import { DomainError } from '@/shared/domain/errors/domainError';
import { IdGenerator } from '@/shared/application/ports/idGenerator';
import { Result } from '@/shared/application/result/result';
import { RetailDayRepository } from '@/contexts/retail-sales/application/ports/outbound/retailDay.repository';
import { BusinessCalendar } from '@/shared/application/ports/businessCalendar';
import { RetailProductSnapshotProvider } from '@/contexts/retail-sales/application/ports/outbound/retailProductSnapshotProvider.port';
import { RetailDayView, toRetailDayView } from '@/contexts/retail-sales/application/retailDayView';
import { RetailDay } from '@/contexts/retail-sales/domain/entities/retailDay';
import { ProductNotFoundForRetailError } from '@/contexts/retail-sales/domain/errors/productNotFoundForRetail.error';

export type AddRetailItemDto = {
  productId: string;
  quantity: number;
};

export class AddRetailItemUseCase {
  constructor(
    private readonly retailDays: RetailDayRepository,
    private readonly snapshots: RetailProductSnapshotProvider,
    private readonly calendar: BusinessCalendar,
    private readonly ids: IdGenerator
  ) {}

  async run(dto: AddRetailItemDto): Promise<Result<RetailDayView>> {
    const productId = dto.productId?.trim();
    if (!productId) {
      return Result.fail(new ProductNotFoundForRetailError(dto.productId ?? ''));
    }

    try {
      const today = this.calendar.today();
      await this.retailDays.compactBefore(today);
      const snapshot = await this.snapshots.getSnapshot(productId);
      if (!snapshot) {
        return Result.fail(new ProductNotFoundForRetailError(productId));
      }

      const existing = await this.retailDays.findByBusinessDate(today);
      if (existing) {
        const updated = existing.addProduct(snapshot, dto.quantity, today);
        await this.retailDays.save(updated);
        return Result.ok(toRetailDayView(updated, today));
      }

      const created = RetailDay.create(this.ids.next(), today).addProduct(snapshot, dto.quantity, today);
      const stored = await this.retailDays.insertIfAbsent(created);
      if (stored.id === created.id) {
        return Result.ok(toRetailDayView(created, today));
      }
      const updated = stored.addProduct(snapshot, dto.quantity, today);
      await this.retailDays.save(updated);
      return Result.ok(toRetailDayView(updated, today));
    } catch (error) {
      if (error instanceof DomainError) {
        return Result.fail(error);
      }
      throw error;
    }
  }
}
