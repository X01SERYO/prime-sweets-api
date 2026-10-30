export type ProductPrimitives = {
  id: string;
  alegraId: string;
  code: string;
  brandId: string | null;
  name: string | null;
  suggestedPrice: number | null;
  units: number;
  pack: number;
  wholesaleCost: number | null;
  wholesalePrice: number | null;
  retailCost: number | null;
  retailPrice: number | null;
};

export class Product {
  private constructor(
    readonly id: string,
    readonly alegraId: string,
    readonly code: string,
    readonly brandId: string | null,
    readonly name: string | null,
    readonly suggestedPrice: number | null,
    readonly units: number,
    readonly pack: number,
    readonly wholesaleCost: number | null,
    readonly wholesalePrice: number | null,
    readonly retailCost: number | null,
    readonly retailPrice: number | null
  ) {}

  static create(params: {
    id: string;
    alegraId: string;
    code?: string | null;
    brandId?: string | null;
    name?: string | null;
    suggestedPrice?: number | null;
    units?: number;
    pack?: number;
    wholesaleCost?: number | null;
    wholesalePrice?: number | null;
    retailCost?: number | null;
    retailPrice?: number | null;
  }): Product {
    return new Product(
      params.id,
      params.alegraId,
      params.code?.trim() || params.alegraId,
      params.brandId ?? null,
      params.name ?? null,
      params.suggestedPrice ?? null,
      params.units ?? 0,
      params.pack ?? 0,
      params.wholesaleCost ?? null,
      params.wholesalePrice ?? null,
      params.retailCost ?? null,
      params.retailPrice ?? null
    );
  }

  update(params: { name?: string | null; wholesalePrice?: number | null; retailPrice?: number | null }): Product {
    return new Product(
      this.id,
      this.alegraId,
      this.code,
      this.brandId,
      params.name !== undefined ? params.name : this.name,
      this.suggestedPrice,
      this.units,
      this.pack,
      this.wholesaleCost,
      params.wholesalePrice !== undefined ? params.wholesalePrice : this.wholesalePrice,
      this.retailCost,
      params.retailPrice !== undefined ? params.retailPrice : this.retailPrice
    );
  }

  toPrimitives(): ProductPrimitives {
    return {
      id: this.id,
      alegraId: this.alegraId,
      code: this.code,
      brandId: this.brandId,
      name: this.name,
      suggestedPrice: this.suggestedPrice,
      units: this.units,
      pack: this.pack,
      wholesaleCost: this.wholesaleCost,
      wholesalePrice: this.wholesalePrice,
      retailCost: this.retailCost,
      retailPrice: this.retailPrice
    };
  }
}
