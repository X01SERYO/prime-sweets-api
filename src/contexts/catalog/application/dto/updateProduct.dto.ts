export interface UpdateProductDto {
  id: string;
  name?: string | null;
  wholesalePrice?: number | null;
  retailPrice?: number | null;
}
