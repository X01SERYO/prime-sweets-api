import { Product } from '../../../domain/entities/product';

export interface ProductRepository {
  findById(id: string): Promise<Product | null>;
  findByAlegraId(alegraId: string): Promise<Product | null>;
  findAll(): Promise<Product[]>;
  search(term: string): Promise<Product[]>;
  nextProductCode(brandId: string | null, brandCode: string): Promise<string>;
  save(product: Product): Promise<void>;
  delete(id: string): Promise<void>;
}
