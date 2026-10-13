import { DataSource } from 'typeorm';
import { SalesDay } from '../../../../domain/entities/salesDay';
import { SalesDayRepository } from '../../../../application/ports/outbound/salesDay.repository';
import { SalesDayEntity } from '../salesDay.entity';

export class TypeOrmSalesDayRepository implements SalesDayRepository {
  constructor(private readonly dataSource: DataSource) {}

  private get repo() {
    return this.dataSource.getRepository(SalesDayEntity);
  }

  async findById(id: string): Promise<SalesDay | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findBySellerAndDate(sellerId: string, date: string): Promise<SalesDay | null> {
    const entity = await this.repo.findOne({ where: { sellerId, date } });
    return entity ? this.toDomain(entity) : null;
  }

  async findActiveBySeller(sellerId: string): Promise<SalesDay | null> {
    const entity = await this.repo.findOne({ where: { sellerId, status: 'OPEN' } });
    return entity ? this.toDomain(entity) : null;
  }

  async save(salesDay: SalesDay): Promise<void> {
    await this.repo.save({
      id: salesDay.id,
      sellerId: salesDay.sellerId,
      date: salesDay.date,
      status: salesDay.status,
      openedAt: salesDay.openedAt,
      closedAt: salesDay.closedAt
    });
  }

  private toDomain(entity: SalesDayEntity): SalesDay {
    return SalesDay.create({
      id: entity.id,
      sellerId: entity.sellerId,
      date: entity.date,
      status: entity.status as 'OPEN' | 'CLOSED',
      openedAt: entity.openedAt,
      closedAt: entity.closedAt
    });
  }
}
