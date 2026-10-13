export type BrandPrimitives = {
  id: string;
  name: string;
  code: string;
};

export class Brand {
  constructor(
    readonly id: string,
    readonly name: string,
    readonly code: string
  ) {}

  static create(id: string, name: string, code: string): Brand {
    const trimmedName = name?.trim();
    const trimmedCode = code?.trim();

    if (!trimmedName) {
      throw new Error('Brand name is required');
    }
    if (!trimmedCode) {
      throw new Error('Brand code is required');
    }

    return new Brand(id, trimmedName, trimmedCode);
  }

  update(params: { name?: string; code?: string }): Brand {
    return Brand.create(this.id, params.name ?? this.name, params.code ?? this.code);
  }

  toPrimitives(): BrandPrimitives {
    return {
      id: this.id,
      name: this.name,
      code: this.code
    };
  }
}
