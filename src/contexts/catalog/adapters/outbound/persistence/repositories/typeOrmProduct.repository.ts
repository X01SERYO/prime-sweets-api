import { randomUUID } from 'crypto';
import { Brackets, DataSource, In } from 'typeorm';
import { Product } from '../../../../domain/entities/product';
import { ProductRepository } from '../../../../application/ports/outbound/product.repository';
import { formatProductCode } from '../../../../domain/productCode';
import { ProductEntity } from '../entities/product.entity';
import { ProductPriceEntity } from '../entities/productPrice.entity';

export class TypeOrmProductRepository implements ProductRepository {
  constructor(private readonly dataSource: DataSource) {}

  private get productRepo() {
    return this.dataSource.getRepository(ProductEntity);
  }

  private get priceRepo() {
    return this.dataSource.getRepository(ProductPriceEntity);
  }

  async findById(id: string): Promise<Product | null> {
    const entity = await this.productRepo.findOne({
      where: { id },
      relations: ['prices', 'brand']
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByAlegraId(alegraId: string): Promise<Product | null> {
    const entity = await this.productRepo.findOne({
      where: { alegraId },
      relations: ['prices', 'brand']
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(): Promise<Product[]> {
    const entities = await this.productRepo.find({
      relations: ['prices', 'brand'],
      order: { name: 'ASC' }
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  async search(term: string): Promise<Product[]> {
    const sanitized = term.trim();
    if (!sanitized) {
      return this.findAll();
    }

    const pattern = `%${sanitized}%`;
    const entities = await this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.prices', 'prices')
      .where('product.name ILIKE :pattern', { pattern })
      .orWhere('brand.name ILIKE :pattern', { pattern })
      .orWhere('brand.code ILIKE :pattern', { pattern })
      .orWhere('product.code ILIKE :pattern', { pattern })
      .orderBy('product.code', 'ASC')
      .getMany();

    return entities.map((entity) => this.toDomain(entity));
  }

  async page(term: string | undefined, page: number, pageSize: number): Promise<{ items: Product[]; total: number }> {
    const filtered = this.productRepo.createQueryBuilder('product').leftJoin('product.brand', 'brand');
    const sanitized = term?.trim();
    if (sanitized) {
      const pattern = `%${sanitized}%`;
      filtered.andWhere(
        new Brackets(query => {
          query
            .where('product.code ILIKE :pattern', { pattern })
            .orWhere('product.name ILIKE :pattern', { pattern })
            .orWhere('brand.name ILIKE :pattern', { pattern })
            .orWhere('brand.code ILIKE :pattern', { pattern });
        })
      );
    }

    const total = await filtered.clone().getCount();
    const rows = await filtered
      .clone()
      .select('product.id', 'id')
      .orderBy('product.code', 'ASC')
      .addOrderBy('product.id', 'ASC')
      .offset((page - 1) * pageSize)
      .limit(pageSize)
      .getRawMany<{ id: string }>();
    const ids = rows.map(row => row.id);
    if (ids.length === 0) {
      return { items: [], total };
    }

    const entities = await this.productRepo.find({
      where: { id: In(ids) },
      relations: ['prices', 'brand']
    });
    const byId = new Map(entities.map(entity => [entity.id, entity]));
    return {
      items: ids.flatMap(id => {
        const entity = byId.get(id);
        return entity ? [this.toDomain(entity)] : [];
      }),
      total
    };
  }

  async nextProductCode(brandId: string | null, brandCode: string): Promise<string> {
    const query = this.productRepo.createQueryBuilder('product').select('product.code', 'code');
    if (brandId) {
      query.where('product.brand_id = :brandId', { brandId });
    } else {
      query.where('product.brand_id IS NULL');
    }
    const rows = await query.getRawMany<{ code: string }>();
    const prefix = brandCode.trim().toUpperCase();
    let max = 0;
    for (const row of rows) {
      const match = new RegExp(`^${prefix}(\\d+)$`).exec(row.code ?? '');
      if (match) {
        max = Math.max(max, Number(match[1]));
      }
    }
    return formatProductCode(prefix, max + 1);
  }

  async delete(id: string): Promise<void> {
    await this.productRepo.delete({ id });
  }

  async save(product: Product): Promise<void> {
    await this.productRepo.save({
      id: product.id,
      alegraId: product.alegraId,
      code: product.code,
      brandId: product.brandId,
      name: product.name,
      suggestedPrice: product.suggestedPrice,
      units: product.units,
      pack: product.pack
    });

    await this.upsertChannelPrice(product.id, 'wholesale', product.wholesaleCost, product.wholesalePrice);
    await this.upsertChannelPrice(product.id, 'retail', product.retailCost, product.retailPrice);
  }

  private async upsertChannelPrice(
    productId: string,
    channel: 'wholesale' | 'retail',
    cost: number | null,
    price: number | null
  ): Promise<void> {
    if (price === null || price === undefined) {
      if (price === null) {
        await this.priceRepo.delete({ productId, channel });
      }
      return;
    }

    const existing = await this.priceRepo.findOne({ where: { productId, channel } });
    await this.priceRepo.save({
      id: existing?.id ?? randomUUID(),
      productId,
      channel,
      cost,
      price
    });
  }

  private toDomain(entity: ProductEntity): Product {
    const wholesale = entity.prices?.find((price: ProductPriceEntity) => price.channel === 'wholesale');
    const retail = entity.prices?.find((price: ProductPriceEntity) => price.channel === 'retail');

    return Product.create({
      id: entity.id,
      alegraId: entity.alegraId,
      code: entity.code,
      brandId: entity.brandId,
      brandName: entity.brand?.name ?? null,
      name: entity.name,
      suggestedPrice: entity.suggestedPrice,
      units: entity.units,
      pack: entity.pack,
      wholesaleCost: wholesale?.cost ?? null,
      wholesalePrice: wholesale?.price ?? null,
      retailCost: retail?.cost ?? null,
      retailPrice: retail?.price ?? null
    });
  }
}
