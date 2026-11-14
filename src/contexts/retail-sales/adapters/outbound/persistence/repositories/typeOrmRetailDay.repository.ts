import { DataSource } from 'typeorm';
import { RetailDayRepository } from '@/contexts/retail-sales/application/ports/outbound/retailDay.repository';
import { RetailDay, RetailDayStatus } from '@/contexts/retail-sales/domain/entities/retailDay';
import { RetailDayEntity } from '@/contexts/retail-sales/adapters/outbound/persistence/retailDay.entity';
import { RetailDayMapper } from '@/contexts/retail-sales/adapters/outbound/persistence/retailDay.mapper';
import { RetailDayNotFoundError } from '@/contexts/retail-sales/domain/errors/retailDayNotFound.error';

export class TypeOrmRetailDayRepository implements RetailDayRepository {
  constructor(private readonly dataSource: DataSource) {}

  async compactBefore(today: string): Promise<void> {
    await this.dataSource.query(
      `UPDATE "retail_days"
       SET "open_items" = NULL, "updated_at" = now()
       WHERE "open_items" IS NOT NULL AND "business_date" < $1`,
      [today]
    );
  }

  async findByBusinessDate(businessDate: string): Promise<RetailDay | null> {
    const entity = await this.dataSource.getRepository(RetailDayEntity).findOne({
      where: { businessDate },
    });
    return entity ? RetailDayMapper.toDomain(entity) : null;
  }

  async insertIfAbsent(day: RetailDay): Promise<RetailDay> {
    const entity = RetailDayMapper.toEntity(day);
    await this.dataSource.query(
      `INSERT INTO "retail_days" (
         "id", "business_date", "status", "total_amount", "total_profit",
         "open_items", "reviewed_at", "reviewed_by", "created_at", "updated_at"
       ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, now(), now())
       ON CONFLICT ("business_date") DO NOTHING`,
      [
        entity.id,
        entity.businessDate,
        entity.status,
        entity.totalAmount,
        entity.totalProfit,
        entity.openItems === null ? null : JSON.stringify(entity.openItems),
        entity.reviewedAt,
        entity.reviewedBy,
      ]
    );
    const stored = await this.findByBusinessDate(day.businessDate);
    if (!stored) {
      throw new RetailDayNotFoundError(day.businessDate);
    }
    return stored;
  }

  async save(day: RetailDay): Promise<void> {
    await this.saveAll([day]);
  }

  async saveAll(days: RetailDay[]): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      for (const day of days) {
        await manager.getRepository(RetailDayEntity).save(RetailDayMapper.toEntity(day));
      }
    });
  }

  async delete(id: string): Promise<void> {
    await this.dataSource.getRepository(RetailDayEntity).delete({ id });
  }

  async listByStatus(
    status: RetailDayStatus,
    page: number,
    pageSize: number
  ): Promise<{ items: RetailDay[]; total: number }> {
    const [entities, total] = await this.dataSource.getRepository(RetailDayEntity).findAndCount({
      where: { status },
      order: { businessDate: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { items: entities.map((entity) => RetailDayMapper.toDomain(entity)), total };
  }
}
