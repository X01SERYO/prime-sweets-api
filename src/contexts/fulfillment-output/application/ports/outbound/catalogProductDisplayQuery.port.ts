import { CatalogProductDisplay } from '../../../domain/entities/loadSheet';

export interface CatalogProductDisplayQuery {
  findByProductIds(productIds: string[]): Promise<CatalogProductDisplay[]>;
}
