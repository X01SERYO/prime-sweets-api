import { Product } from '../../../domain/entities/product';

export interface ProductRepository {
  findById(id: string): Promise<Product | null>;
  findByAlegraId(alegraId: string): Promise<Product | null>;
  findAll(): Promise<Product[]>;
  search(term: string): Promise<Product[]>;
  page(term: string | undefined, page: number, pageSize: number): Promise<{ items: Product[]; total: number }>;
  nextProductCode(brandId: string | null, brandCode: string): Promise<string>;
  save(product: Product): Promise<void>;
  delete(id: string): Promise<void>;
}
