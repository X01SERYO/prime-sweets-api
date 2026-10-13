import { LoadSheetProductNameMissingError } from '../errors/loadSheetProductNameMissing.error';
import { ProductNotFoundForLoadSheetError } from '../errors/productNotFoundForLoadSheet.error';

export type LoadSheetLinePrimitives = {
  productId: string;
  brand: string | null;
  wholesaleCost: number | null;
  wholesaleSalePrice: number | null;
  name: string;
  quantity: number;
  totalPrice: number;
  profit: number;
};

export type LoadSheetPrimitives = {
  salesDayId: string;
  lines: LoadSheetLinePrimitives[];
};

export type ConfirmedSaleItemContribution = {
  productId: string;
  quantity: number;
  wholesaleCost: number;
  wholesaleSalePrice: number;
  totalPrice: number;
  profit: number;
};

export type CatalogProductDisplay = {
  productId: string;
  brand: string | null;
  name: string;
};

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function uniqueNumber(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  const first = values[0];
  return values.every((value) => value === first) ? first : null;
}

export class LoadSheet {
  private constructor(
    readonly salesDayId: string,
    private readonly lines: LoadSheetLinePrimitives[]
  ) {}

  static compose(params: {
    salesDayId: string;
    contributions: ConfirmedSaleItemContribution[];
    displays: CatalogProductDisplay[];
  }): LoadSheet {
    const displaysByProductId = new Map(params.displays.map((display) => [display.productId, display]));
    const groups = new Map<string, ConfirmedSaleItemContribution[]>();

    for (const contribution of params.contributions) {
      const existing = groups.get(contribution.productId) ?? [];
      existing.push(contribution);
      groups.set(contribution.productId, existing);
    }

    const lines: LoadSheetLinePrimitives[] = [];

    for (const [productId, items] of groups) {
      const display = displaysByProductId.get(productId);
      if (!display) {
        throw new ProductNotFoundForLoadSheetError(productId);
      }

      const name = display.name.trim();
      if (!name) {
        throw new LoadSheetProductNameMissingError(productId);
      }

      const quantity = items.reduce((sum, item) => sum + item.quantity, 0);
      const totalPrice = roundMoney(items.reduce((sum, item) => sum + item.totalPrice, 0));
      const profit = roundMoney(items.reduce((sum, item) => sum + item.profit, 0));

      lines.push({
        productId,
        brand: display.brand,
        wholesaleCost: uniqueNumber(items.map((item) => item.wholesaleCost)),
        wholesaleSalePrice: uniqueNumber(items.map((item) => item.wholesaleSalePrice)),
        name,
        quantity,
        totalPrice,
        profit
      });
    }

    lines.sort((left, right) => {
      const brandCompare = (left.brand ?? '\uffff').localeCompare(right.brand ?? '\uffff');
      if (brandCompare !== 0) {
        return brandCompare;
      }

      const nameCompare = left.name.localeCompare(right.name);
      if (nameCompare !== 0) {
        return nameCompare;
      }

      return left.productId.localeCompare(right.productId);
    });

    return new LoadSheet(params.salesDayId, lines);
  }

  toPrimitives(): LoadSheetPrimitives {
    return {
      salesDayId: this.salesDayId,
      lines: this.lines.map((line) => ({ ...line }))
    };
  }
}
