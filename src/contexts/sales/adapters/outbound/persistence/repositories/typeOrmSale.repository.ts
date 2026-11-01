import { DataSource, Repository } from 'typeorm';
import { Sale } from '../../../../domain/entities/sale';
import { ListSalesFilters, SaleRepository } from '../../../../application/ports/outbound/sale.repository';
import { SaleBatch } from '../../../../application/ports/outbound/saleBatch.port';
import { SaleEntity } from '../sale.entity';
import { SaleItemEntity } from '../saleItem.entity';
import { SaleMapper } from '../sale.mapper';

export class TypeOrmSaleRepository implements SaleRepository, SaleBatch {
  constructor(private readonly dataSource: DataSource) {}

  private get repository(): Repository<SaleEntity> {
    return this.dataSource.getRepository(SaleEntity);
  }

  async save(sale: Sale): Promise<void> {
    await this.saveAll([sale]);
  }

  async saveAll(sales: Sale[]): Promise<void> {
    const prepared = sales.map(sale => {
      const entity = SaleMapper.toEntity(sale);
      const items = entity.items ?? [];
      delete (entity as Partial<SaleEntity>).items;
      return { saleId: sale.id, entity, items };
    });

    await this.repository.manager.transaction(async (transactionalEntityManager) => {
      for (const row of prepared) {
        await transactionalEntityManager.delete(SaleItemEntity, { saleId: row.saleId });
        await transactionalEntityManager.save(SaleEntity, row.entity);
        if (row.items.length > 0) {
          await transactionalEntityManager.save(SaleItemEntity, row.items);
        }
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

  async list(filters?: ListSalesFilters): Promise<Sale[]> {
    const query = this.repository.createQueryBuilder('sale').leftJoinAndSelect('sale.items', 'item');

    if (filters?.deliveryDate) {
      query.andWhere('sale.delivery_date = :deliveryDate', { deliveryDate: filters.deliveryDate });
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
