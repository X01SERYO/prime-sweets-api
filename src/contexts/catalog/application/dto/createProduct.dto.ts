export interface CreateProductDto {
  alegraId: string;
  name?: string | null;
  brandId?: string | null;
  suggestedPrice?: number | null;
  units?: number;
  pack?: number;
  wholesaleCost?: number | null;
  wholesalePrice?: number | null;
  retailCost?: number | null;
  retailPrice?: number | null;
}
