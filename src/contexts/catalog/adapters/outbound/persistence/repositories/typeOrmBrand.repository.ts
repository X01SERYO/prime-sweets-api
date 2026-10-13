import { DataSource } from 'typeorm';
import { Brand } from '../../../../domain/entities/brand';
import { BrandRepository } from '../../../../application/ports/outbound/brand.repository';
import { BrandEntity } from '../../../../../../shared/infrastructure/persistence/typeorm/brand.entity';

export class TypeOrmBrandRepository implements BrandRepository {
  constructor(private readonly dataSource: DataSource) {}

  private get repo() {
    return this.dataSource.getRepository(BrandEntity);
  }

  async save(brand: Brand): Promise<void> {
    await this.repo.save({ id: brand.id, name: brand.name, code: brand.code });
  }

  async findById(id: string): Promise<Brand | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByName(name: string): Promise<Brand | null> {
    const entity = await this.repo.findOne({ where: { name } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByCode(code: string): Promise<Brand | null> {
    const entity = await this.repo.findOne({ where: { code } });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(): Promise<Brand[]> {
    const entities = await this.repo.find({ order: { name: 'ASC' } });
    return entities.map((entity) => this.toDomain(entity));
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete({ id });
  }

  private toDomain(entity: BrandEntity): Brand {
    return new Brand(entity.id, entity.name, entity.code);
  }
}
