import { LoadSheetProductNameMissingError } from '../errors/loadSheetProductNameMissing.error';
import { ProductNotFoundForLoadSheetError } from '../errors/productNotFoundForLoadSheet.error';

export type LoadSheetPriceGroupPrimitives = {
  wholesaleCost: number;
  wholesaleSalePrice: number;
  quantity: number;
  totalPrice: number;
  profit: number;
};

export type LoadSheetLinePrimitives = {
  productId: string;
  brand: string | null;
  wholesaleCost: number | null;
  wholesaleSalePrice: number | null;
  name: string;
  quantity: number;
  totalPrice: number;
  profit: number;
  priceGroups: LoadSheetPriceGroupPrimitives[];
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
  wholesaleCost: number | null;
  wholesaleSalePrice: number | null;
};

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function priceKey(cost: number, salePrice: number): string {
  return `${cost}|${salePrice}`;
}

function priceGroups(items: ConfirmedSaleItemContribution[]): LoadSheetPriceGroupPrimitives[] {
  const groups = new Map<string, LoadSheetPriceGroupPrimitives>();

  for (const item of items) {
    const key = priceKey(item.wholesaleCost, item.wholesaleSalePrice);
    const existing = groups.get(key);
    if (!existing) {
      groups.set(key, {
        wholesaleCost: item.wholesaleCost,
        wholesaleSalePrice: item.wholesaleSalePrice,
        quantity: item.quantity,
        totalPrice: roundMoney(item.totalPrice),
        profit: roundMoney(item.profit)
      });
      continue;
    }

    existing.quantity += item.quantity;
    existing.totalPrice = roundMoney(existing.totalPrice + item.totalPrice);
    existing.profit = roundMoney(existing.profit + item.profit);
  }

  return [...groups.values()].sort((left, right) => {
    if (left.wholesaleSalePrice !== right.wholesaleSalePrice) {
      return left.wholesaleSalePrice - right.wholesaleSalePrice;
    }
    return left.wholesaleCost - right.wholesaleCost;
  });
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
      const prices = priceGroups(items);
      const singlePrice = prices[0];
      const mixedPrices = prices.length > 1;
      if (!singlePrice) {
        continue;
      }

      lines.push({
        productId,
        brand: display.brand,
        wholesaleCost: mixedPrices ? display.wholesaleCost : singlePrice.wholesaleCost,
        wholesaleSalePrice: mixedPrices ? display.wholesaleSalePrice : singlePrice.wholesaleSalePrice,
        name,
        quantity,
        totalPrice,
        profit,
        priceGroups: mixedPrices ? prices : []
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
