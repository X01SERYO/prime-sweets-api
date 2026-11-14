import { CatalogProductDisplay } from '@/contexts/fulfillment-output/domain/entities/loadSheet';

export interface CatalogProductDisplayQuery {
  findByProductIds(productIds: string[]): Promise<CatalogProductDisplay[]>;
}
