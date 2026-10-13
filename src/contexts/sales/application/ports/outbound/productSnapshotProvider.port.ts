export type ProductSnapshot = {
  id: string;
  name: string;
  wholesalePrice: number;
  wholesaleCost: number;
};

export interface ProductSnapshotProvider {
  getSnapshot(productId: string): Promise<ProductSnapshot | null>;
}
