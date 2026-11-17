import { SupplierNameInvalidError } from '@/contexts/purchasing/domain/errors/supplierNameInvalid.error';

export type SupplierProductLink = {
  productId: string;
  previousQuantity: number | null;
  lastQuantity: number | null;
  lastUnitCost: number | null;
  lastItemName: string | null;
};

export type SavedPurchaseLineHint = {
  productId: string;
  quantity: number;
  unitCost: number;
  itemName: string;
};

export type SupplierPrimitives = {
  id: string;
  name: string;
  products: SupplierProductLink[];
};

export class Supplier {
  private constructor(
    readonly id: string,
    private _name: string,
    private _products: SupplierProductLink[]
  ) {}

  get name(): string {
    return this._name;
  }

  get products(): SupplierProductLink[] {
    return this._products.map(link => ({ ...link }));
  }

  static create(id: string, name: string): Supplier {
    return new Supplier(id, normalizeName(name), []);
  }

  static rehydrate(params: SupplierPrimitives): Supplier {
    return new Supplier(
      params.id,
      normalizeName(params.name),
      params.products.map(link => ({ ...link }))
    );
  }

  rename(name: string): void {
    this._name = normalizeName(name);
  }

  linkProduct(productId: string): void {
    if (this._products.some(link => link.productId === productId)) {
      return;
    }
    this._products.push({
      productId,
      previousQuantity: null,
      lastQuantity: null,
      lastUnitCost: null,
      lastItemName: null
    });
  }

  unlinkProduct(productId: string): void {
    this._products = this._products.filter(link => link.productId !== productId);
  }

  applySavedLines(lines: SavedPurchaseLineHint[], shiftPrevious = true): void {
    const byProduct = new Map<string, SavedPurchaseLineHint[]>();
    for (const line of lines) {
      const group = byProduct.get(line.productId) ?? [];
      group.push(line);
      byProduct.set(line.productId, group);
    }
    this._products = this._products.map(link => {
      const group = byProduct.get(link.productId);
      const previousQuantity = shiftPrevious ? link.lastQuantity : link.previousQuantity;
      if (!group) {
        return {
          productId: link.productId,
          previousQuantity,
          lastQuantity: null,
          lastUnitCost: null,
          lastItemName: null
        };
      }
      const sameName = group.every(line => line.itemName === group[0].itemName);
      return {
        productId: link.productId,
        previousQuantity,
        lastQuantity: group.reduce((sum, line) => sum + line.quantity, 0),
        lastUnitCost: group[0].unitCost,
        lastItemName: sameName ? group[0].itemName : null
      };
    });
  }

  toPrimitives(): SupplierPrimitives {
    return { id: this.id, name: this._name, products: this.products };
  }
}

function normalizeName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length < 1 || trimmed.length > 120) {
    throw new SupplierNameInvalidError();
  }
  return trimmed.toLocaleUpperCase('es-CO');
}
