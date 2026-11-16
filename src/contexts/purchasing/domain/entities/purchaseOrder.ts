import { InvalidPurchaseQuantityError } from '@/contexts/purchasing/domain/errors/invalidPurchaseQuantity.error';
import { ProductWithoutCostError } from '@/contexts/purchasing/domain/errors/productWithoutCost.error';
import { PurchaseLineNameInvalidError } from '@/contexts/purchasing/domain/errors/purchaseLineNameInvalid.error';
import { PurchaseOrderEmptyError } from '@/contexts/purchasing/domain/errors/purchaseOrderEmpty.error';
import { itemNames } from '@/shared/domain/itemName';

export type PurchaseOrderLine = {
  productId: string;
  productCode: string;
  brandName: string;
  catalogName: string;
  itemName: string;
  unitCost: number;
  quantity: number;
};

export type PurchaseOrderPrimitives = {
  id: string;
  supplierId: string;
  lines: PurchaseOrderLine[];
  lineCount: number;
  totalCost: number;
  createdAt: string;
};

export class PurchaseOrder {
  private constructor(
    readonly id: string,
    readonly supplierId: string,
    private _lines: PurchaseOrderLine[] | null,
    private readonly _lineCount: number,
    private readonly _totalCost: number,
    readonly createdAt: Date
  ) {}

  get lines(): PurchaseOrderLine[] {
    return this._lines ? this._lines.map(line => ({ ...line })) : [];
  }

  get hasLines(): boolean {
    return this._lines !== null;
  }

  get lineCount(): number {
    return this._lineCount;
  }

  get totalCost(): number {
    return this._totalCost;
  }

  static create(id: string, supplierId: string, lines: PurchaseOrderLine[], createdAt: Date): PurchaseOrder {
    const normalized = normalizeLines(lines);
    const totalCost = roundMoney(normalized.reduce((sum, line) => sum + lineCost(line), 0));
    return new PurchaseOrder(id, supplierId, normalized, normalized.length, totalCost, createdAt);
  }

  static rehydrate(params: {
    id: string;
    supplierId: string;
    lines: PurchaseOrderLine[] | null;
    lineCount: number;
    totalCost: number;
    createdAt: Date;
  }): PurchaseOrder {
    return new PurchaseOrder(
      params.id,
      params.supplierId,
      params.lines ? params.lines.map(line => ({ ...line })) : null,
      params.lineCount,
      params.totalCost,
      params.createdAt
    );
  }

  dropLines(): void {
    this._lines = null;
  }

  toPrimitives(): PurchaseOrderPrimitives {
    return {
      id: this.id,
      supplierId: this.supplierId,
      lines: this.lines,
      lineCount: this._lineCount,
      totalCost: this._totalCost,
      createdAt: this.createdAt.toISOString()
    };
  }
}

export function lineCost(line: Pick<PurchaseOrderLine, 'unitCost' | 'quantity'>): number {
  return roundMoney(line.unitCost * line.quantity);
}

function normalizeLines(lines: PurchaseOrderLine[]): PurchaseOrderLine[] {
  if (lines.length === 0) {
    throw new PurchaseOrderEmptyError();
  }
  const merged: PurchaseOrderLine[] = [];
  for (const line of lines) {
    if (!Number.isInteger(line.quantity) || line.quantity < 1) {
      throw new InvalidPurchaseQuantityError();
    }
    if (!(line.unitCost > 0)) {
      throw new ProductWithoutCostError(line.productId);
    }
    const names = itemNames(line.catalogName, line.itemName.trim() || line.catalogName);
    if (!names.catalogName) {
      throw new PurchaseLineNameInvalidError();
    }
    const normalized = { ...line, catalogName: names.catalogName, itemName: names.itemName };
    const sameName = normalized.itemName.toLocaleLowerCase('es-CO');
    const existing = merged.find(
      item => item.productId === normalized.productId && item.itemName.toLocaleLowerCase('es-CO') === sameName
    );
    if (existing) {
      existing.quantity += normalized.quantity;
    } else {
      merged.push(normalized);
    }
  }
  return merged;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
