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

    const items = entity.items ?? [];
    delete (entity as Partial<SaleEntity>).items;

    await this.repository.manager.transaction(async (transactionalEntityManager) => {
      await transactionalEntityManager.delete(SaleItemEntity, { saleId: sale.id });
      await transactionalEntityManager.save(SaleEntity, entity);
      if (items.length > 0) {
        await transactionalEntityManager.save(SaleItemEntity, items);
      }
    });
  }

  async findById(id: string): Promise<Sale | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['items'],
      order: { items: { createdAt: 'DESC' } }
    });

    if (!entity) return null;
    return SaleMapper.toDomain(entity);
  }

  async findBySalesDayId(salesDayId: string): Promise<Sale[]> {
    const entities = await this.repository.find({
      where: { salesDayId },
      relations: ['items'],
      order: { createdAt: 'DESC', items: { createdAt: 'DESC' } }
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

    query.orderBy('sale.created_at', 'DESC').addOrderBy('item.created_at', 'DESC');

    const entities = await query.getMany();
    return entities.map(SaleMapper.toDomain);
  }
}
