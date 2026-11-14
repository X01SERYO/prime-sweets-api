import { InvalidRetailQuantityError } from '@/contexts/retail-sales/domain/errors/invalidRetailQuantity.error';
import { ProductWithoutRetailPriceError } from '@/contexts/retail-sales/domain/errors/productWithoutRetailPrice.error';

export type RetailDayItemPrimitives = {
  productId: string;
  productCode: string;
  brandName: string;
  productName: string;
  retailPrice: number;
  retailCost: number | null;
  quantity: number;
  totalPrice: number;
  profit: number;
  hasCost: boolean;
};

export type RetailProductSnapshot = {
  productId: string;
  productCode: string;
  brandName: string;
  productName: string;
  retailPrice: number;
  retailCost: number | null;
};

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function isRetailQuantity(quantity: number): boolean {
  return Number.isInteger(quantity) && quantity >= 1;
}

export class RetailDayItem {
  private constructor(
    readonly productId: string,
    readonly productCode: string,
    readonly brandName: string,
    readonly productName: string,
    readonly retailPrice: number,
    readonly retailCost: number | null,
    private readonly _quantity: number
  ) {}

  get quantity(): number {
    return this._quantity;
  }

  get hasCost(): boolean {
    return this.retailCost !== null && this.retailCost > 0;
  }

  get totalPrice(): number {
    return roundMoney(this.retailPrice * this._quantity);
  }

  get profit(): number {
    if (!this.hasCost || this.retailCost === null) {
      return 0;
    }
    return roundMoney((this.retailPrice - this.retailCost) * this._quantity);
  }

  static fromSnapshot(snapshot: RetailProductSnapshot, quantity: number): RetailDayItem {
    if (!(snapshot.retailPrice > 0)) {
      throw new ProductWithoutRetailPriceError(snapshot.productId);
    }
    assertRetailQuantity(quantity);
    return new RetailDayItem(
      snapshot.productId,
      snapshot.productCode,
      snapshot.brandName,
      snapshot.productName,
      snapshot.retailPrice,
      snapshot.retailCost,
      quantity
    );
  }

  withAddedQuantity(quantity: number): RetailDayItem {
    assertRetailQuantity(quantity);
    return this.withQuantity(this._quantity + quantity);
  }

  withQuantity(quantity: number): RetailDayItem {
    assertRetailQuantity(quantity);
    return new RetailDayItem(
      this.productId,
      this.productCode,
      this.brandName,
      this.productName,
      this.retailPrice,
      this.retailCost,
      quantity
    );
  }

  toPrimitives(): RetailDayItemPrimitives {
    return {
      productId: this.productId,
      productCode: this.productCode,
      brandName: this.brandName,
      productName: this.productName,
      retailPrice: this.retailPrice,
      retailCost: this.retailCost,
      quantity: this._quantity,
      totalPrice: this.totalPrice,
      profit: this.profit,
      hasCost: this.hasCost,
    };
  }
}

function assertRetailQuantity(quantity: number): void {
  if (!isRetailQuantity(quantity)) {
    throw new InvalidRetailQuantityError();
  }
}
