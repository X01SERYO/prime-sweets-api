export type PurchaseProductSheet = {
  productId: string;
  productCode: string;
  brandName: string;
  productName: string;
  unitCost: number | null;
};

export interface PurchaseProductReader {
  findMany(productIds: string[]): Promise<PurchaseProductSheet[]>;
}
