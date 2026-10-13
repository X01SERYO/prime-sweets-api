import { Brand } from '../../../domain/entities/brand';

export interface BrandRepository {
  save(brand: Brand): Promise<void>;
  findById(id: string): Promise<Brand | null>;
  findByName(name: string): Promise<Brand | null>;
  findByCode(code: string): Promise<Brand | null>;
  findAll(): Promise<Brand[]>;
  delete(id: string): Promise<void>;
}
