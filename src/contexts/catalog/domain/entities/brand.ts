import { InvalidBrandError } from '../errors/invalidBrand.error';

export type BrandPrimitives = {
  id: string;
  name: string;
  code: string;
};

export class Brand {
  private constructor(
    readonly id: string,
    readonly name: string,
    readonly code: string
  ) {}

  static create(id: string, name: string, code: string): Brand {
    const trimmedName = name?.trim().toLocaleUpperCase('es-CO');
    const trimmedCode = code?.trim().toLocaleUpperCase('es-CO');

    if (!trimmedName) {
      throw new InvalidBrandError('Brand name is required');
    }
    if (!trimmedCode) {
      throw new InvalidBrandError('Brand code is required');
    }
    if ([...trimmedCode].length > 3) {
      throw new InvalidBrandError('Brand code must be at most 3 characters');
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
