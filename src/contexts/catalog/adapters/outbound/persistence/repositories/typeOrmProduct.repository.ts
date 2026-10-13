import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';
import { Product } from '../../../../domain/entities/product';
import { ProductRepository } from '../../../../application/ports/outbound/product.repository';
import { ProductEntity } from '../../../../../../shared/infrastructure/persistence/typeorm/product.entity';
import { ProductPriceEntity } from '../../../../../../shared/infrastructure/persistence/typeorm/productPrice.entity';

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
      relations: ['prices']
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByAlegraId(alegraId: string): Promise<Product | null> {
    const entity = await this.productRepo.findOne({
      where: { alegraId },
      relations: ['prices']
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(): Promise<Product[]> {
    const entities = await this.productRepo.find({
      relations: ['prices'],
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
      .orWhere('product.alegraId ILIKE :pattern', { pattern })
      .orderBy('product.name', 'ASC')
      .getMany();

    return entities.map((entity) => this.toDomain(entity));
  }

  async delete(id: string): Promise<void> {
    await this.productRepo.delete({ id });
  }

  async save(product: Product): Promise<void> {
    await this.productRepo.save({
      id: product.id,
      alegraId: product.alegraId,
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
      brandId: entity.brandId,
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
