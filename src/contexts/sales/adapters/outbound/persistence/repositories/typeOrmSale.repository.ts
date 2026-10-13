import { DataSource, Repository } from 'typeorm';
import { Sale } from '../../../../domain/entities/sale';
import { ListSalesFilters, SaleRepository } from '../../../../application/ports/outbound/sale.repository';
import { SaleEntity } from '../sale.entity';
import { SaleItemEntity } from '../saleItem.entity';
import { SaleMapper } from '../sale.mapper';

export class TypeOrmSaleRepository implements SaleRepository {
  constructor(private readonly dataSource: DataSource) {}

  private get repository(): Repository<SaleEntity> {
    return this.dataSource.getRepository(SaleEntity);
  }

  async save(sale: Sale): Promise<void> {
    const entity = SaleMapper.toEntity(sale);

    await this.repository.manager.transaction(async (transactionalEntityManager) => {
      // First save or update the sale root record
      await transactionalEntityManager.save(SaleEntity, entity);

      // Replace sale items atomically to reflect additions, removals, or edits
      await transactionalEntityManager.delete(SaleItemEntity, { saleId: sale.id });
      if (entity.items && entity.items.length > 0) {
        await transactionalEntityManager.save(SaleItemEntity, entity.items);
      }
    });
  }

  async findById(id: string): Promise<Sale | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['items']
    });

    if (!entity) return null;
    return SaleMapper.toDomain(entity);
  }

  async findBySalesDayId(salesDayId: string): Promise<Sale[]> {
    const entities = await this.repository.find({
      where: { salesDayId },
      relations: ['items'],
      order: { createdAt: 'ASC' }
    });

    return entities.map(SaleMapper.toDomain);
  }

  async list(filters?: ListSalesFilters): Promise<Sale[]> {
    const query = this.repository.createQueryBuilder('sale').leftJoinAndSelect('sale.items', 'item');

    if (filters?.salesDayId) {
      query.andWhere('sale.sales_day_id = :salesDayId', { salesDayId: filters.salesDayId });
    }

    if (filters?.customerId) {
      query.andWhere('sale.customer_id = :customerId', { customerId: filters.customerId });
    }

    if (filters?.status) {
      query.andWhere('sale.status = :status', { status: filters.status });
    }

    query.orderBy('sale.created_at', 'ASC');

    const entities = await query.getMany();
    return entities.map(SaleMapper.toDomain);
  }
}
