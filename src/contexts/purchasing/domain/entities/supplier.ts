import { SupplierNameInvalidError } from '@/contexts/purchasing/domain/errors/supplierNameInvalid.error';

export type SupplierProductItem = {
  itemName: string;
  lastQuantity: number | null;
};

export type SupplierProductLink = {
  productId: string;
  previousQuantity: number | null;
  lastQuantity: number | null;
  lastUnitCost: number | null;
  lastItemName: string | null;
  items: SupplierProductItem[];
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
      params.products.map(link => ({ ...link, items: (link.items ?? []).map(item => ({ ...item })) }))
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
      lastItemName: null,
      items: []
    });
  }

  unlinkProduct(productId: string): void {
    this._products = this._products.filter(link => link.productId !== productId);
  }

  rememberItems(entries: { productId: string; itemName: string }[]): void {
    const extras = new Map<string, SupplierProductItem[]>();
    for (const entry of entries) {
      const itemName = entry.itemName.trim();
      if (!itemName) continue;
      const current = extras.get(entry.productId) ?? [];
      const key = itemName.toLocaleLowerCase('es-CO');
      if (!current.some(item => item.itemName.toLocaleLowerCase('es-CO') === key)) {
        current.push({ itemName, lastQuantity: null });
      }
      extras.set(entry.productId, current);
    }
    this._products = this._products.map(link => {
      const incoming = extras.get(link.productId);
      if (!incoming) return link;
      const items = link.items.map(item => ({ ...item }));
      for (const item of incoming) {
        const key = item.itemName.toLocaleLowerCase('es-CO');
        if (!items.some(existing => existing.itemName.toLocaleLowerCase('es-CO') === key)) {
          items.push(item);
        }
      }
      return { ...link, items, lastItemName: items.length === 1 ? items[0].itemName : link.lastItemName };
    });
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
      const items = mergeItems(link.items, group);
      if (!group) {
        return {
          productId: link.productId,
          previousQuantity,
          lastQuantity: null,
          lastUnitCost: null,
          lastItemName: items.length === 1 ? items[0].itemName : null,
          items
        };
      }
      return {
        productId: link.productId,
        previousQuantity,
        lastQuantity: group.reduce((sum, line) => sum + line.quantity, 0),
        lastUnitCost: group[0].unitCost,
        lastItemName: items.length === 1 ? items[0].itemName : null,
        items
      };
    });
  }

  toPrimitives(): SupplierPrimitives {
    return { id: this.id, name: this._name, products: this.products };
  }
}

function mergeItems(existing: SupplierProductItem[], group: SavedPurchaseLineHint[] | undefined): SupplierProductItem[] {
  const items = existing.map(item => ({
    itemName: item.itemName,
    lastQuantity: group ? null : item.lastQuantity
  }));
  if (!group) return items;
  for (const line of group) {
    const key = line.itemName.toLocaleLowerCase('es-CO');
    const current = items.find(item => item.itemName.toLocaleLowerCase('es-CO') === key);
    if (current) {
      current.itemName = line.itemName;
      current.lastQuantity = line.quantity;
    } else {
      items.push({ itemName: line.itemName, lastQuantity: line.quantity });
    }
  }
  return items;
}

function normalizeName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length < 1 || trimmed.length > 120) {
    throw new SupplierNameInvalidError();
  }
  return trimmed.toLocaleUpperCase('es-CO');
}
