import { InvalidSaleError } from '../errors/invalidSale.error';
import { InvalidQuantityError } from '../errors/invalidQuantity.error';

export function isSellableQuantity(quantity: number): boolean {
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return false;
  }
  const thousandths = Math.round(quantity * 1000);
  return Math.abs(quantity * 1000 - thousandths) < 1e-6;
}

export type SaleItemPrimitives = {
  id: string;
  productId: string;
  productCode: string;
  catalogName: string;
  itemName: string;
  quantity: number;
  wholesalePrice: number;
  wholesaleCost: number;
  totalPrice: number;
  profit: number;
  createdAt: string;
};

export class SaleItem {
  private constructor(
    readonly id: string,
    readonly productId: string,
    private _productCode: string,
    private _itemName: string,
    private _catalogName: string,
    private _quantity: number,
    readonly wholesalePrice: number,
    readonly wholesaleCost: number,
    readonly createdAt: Date
  ) {}

  get productCode(): string {
    return this._productCode;
  }

  get itemName(): string {
    return this._itemName;
  }

  get catalogName(): string {
    return this._catalogName;
  }

  get quantity(): number {
    return this._quantity;
  }

  get totalPrice(): number {
    return Math.round(this._quantity * this.wholesalePrice * 100) / 100;
  }

  get profit(): number {
    return Math.round((this.totalPrice - this.wholesaleCost * this._quantity) * 100) / 100;
  }

  static create(params: {
    id: string;
    productId: string;
    productCode?: string;
    itemName: string;
    catalogName?: string;
    quantity: number;
    wholesalePrice: number;
    wholesaleCost: number;
    createdAt?: Date;
  }): SaleItem {
    const trimmedId = params.id?.trim();
    if (!trimmedId) {
      throw new InvalidSaleError('Sale item id cannot be empty');
    }

    const trimmedProductId = params.productId?.trim();
    if (!trimmedProductId) {
      throw new InvalidSaleError('Sale item productId cannot be empty');
    }

    const trimmedItemName = params.itemName?.trim();
    if (!trimmedItemName) {
      throw new InvalidSaleError('Sale item name cannot be empty');
    }

    if (!isSellableQuantity(params.quantity)) {
      throw new InvalidQuantityError('Quantity must be greater than 0');
    }

    if (typeof params.wholesalePrice !== 'number' || Number.isNaN(params.wholesalePrice) || params.wholesalePrice < 0) {
      throw new InvalidSaleError('Wholesale price must be a number greater than or equal to 0');
    }

    if (typeof params.wholesaleCost !== 'number' || Number.isNaN(params.wholesaleCost) || params.wholesaleCost < 0) {
      throw new InvalidSaleError('Wholesale cost must be a number greater than or equal to 0');
    }

    const catalogName = params.catalogName?.trim() || trimmedItemName;

    return new SaleItem(
      trimmedId,
      trimmedProductId,
      params.productCode?.trim() ?? '',
      trimmedItemName,
      catalogName,
      params.quantity,
      params.wholesalePrice,
      params.wholesaleCost,
      params.createdAt ?? new Date()
    );
  }

  updateQuantity(newQuantity: number): SaleItem {
    if (!Number.isInteger(newQuantity) || newQuantity <= 0) {
      throw new InvalidQuantityError('Quantity must be an integer greater than 0');
    }

    return new SaleItem(
      this.id,
      this.productId,
      this._productCode,
      this._itemName,
      this._catalogName,
      newQuantity,
      this.wholesalePrice,
      this.wholesaleCost,
      this.createdAt
    );
  }

  updateItemName(newItemName: string): SaleItem {
    const trimmed = newItemName?.trim();
    if (!trimmed) {
      throw new InvalidSaleError('Sale item name cannot be empty');
    }

    return new SaleItem(
      this.id,
      this.productId,
      this._productCode,
      trimmed,
      this._catalogName,
      this._quantity,
      this.wholesalePrice,
      this.wholesaleCost,
      this.createdAt
    );
  }

  toPrimitives(): SaleItemPrimitives {
    return {
      id: this.id,
      productId: this.productId,
      productCode: this._productCode,
      itemName: this._itemName,
      catalogName: this._catalogName,
      quantity: this._quantity,
      wholesalePrice: this.wholesalePrice,
      wholesaleCost: this.wholesaleCost,
      totalPrice: this.totalPrice,
      profit: this.profit,
      createdAt: this.createdAt.toISOString()
    };
  }
}
