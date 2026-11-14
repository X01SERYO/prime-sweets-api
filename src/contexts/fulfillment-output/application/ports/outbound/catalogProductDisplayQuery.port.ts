import { CatalogProductDisplay } from '@fulfillment-output/domain/entities/loadSheet';

export interface CatalogProductDisplayQuery {
  findByProductIds(productIds: string[]): Promise<CatalogProductDisplay[]>;
}
