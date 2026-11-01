export interface UpdateProductDto {
  id: string;
  name?: string;
  wholesaleCost?: number;
  wholesalePrice?: number;
  retailCost?: number;
  retailPrice?: number;
  units?: number;
  pack?: number;
}
