function upperName(name: string | null | undefined): string | null {
  if (name == null) {
    return null;
  }
  const trimmed = name.trim();
  return trimmed ? trimmed.toLocaleUpperCase('es-CO') : null;
}

export type ProductPrimitives = {
  id: string;
  alegraId: string;
  code: string;
  brandId: string | null;
  brandName: string | null;
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
    readonly brandName: string | null,
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
    brandName?: string | null;
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
      params.brandName ?? null,
      upperName(params.name),
      params.suggestedPrice ?? null,
      params.units ?? 0,
      params.pack ?? 0,
      params.wholesaleCost ?? null,
      params.wholesalePrice ?? null,
      params.retailCost ?? null,
      params.retailPrice ?? null
    );
  }

  update(params: {
    name?: string;
    wholesaleCost?: number;
    wholesalePrice?: number;
    retailCost?: number;
    retailPrice?: number;
    units?: number;
    pack?: number;
  }): Product {
    return new Product(
      this.id,
      this.alegraId,
      this.code,
      this.brandId,
      this.brandName,
      params.name !== undefined ? upperName(params.name) : this.name,
      this.suggestedPrice,
      params.units !== undefined ? params.units : this.units,
      params.pack !== undefined ? params.pack : this.pack,
      params.wholesaleCost !== undefined ? params.wholesaleCost : this.wholesaleCost,
      params.wholesalePrice !== undefined ? params.wholesalePrice : this.wholesalePrice,
      params.retailCost !== undefined ? params.retailCost : this.retailCost,
      params.retailPrice !== undefined ? params.retailPrice : this.retailPrice
    );
  }

  toPrimitives(): ProductPrimitives {
    return {
      id: this.id,
      alegraId: this.alegraId,
      code: this.code,
      brandId: this.brandId,
      brandName: this.brandName,
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
