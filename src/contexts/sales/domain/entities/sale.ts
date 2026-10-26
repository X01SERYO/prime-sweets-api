import { SaleItem, SaleItemPrimitives } from './saleItem';
import { InvalidSaleError } from '../errors/invalidSale.error';
import { SaleMustContainItemsError } from '../errors/saleMustContainItems.error';
import { SaleCannotBeModifiedError } from '../errors/saleCannotBeModified.error';
import { SaleAlreadyVoidedError } from '../errors/saleAlreadyVoided.error';

export type SaleStatus = 'DRAFT' | 'CONFIRMED' | 'VOIDED';

export type SalePrimitives = {
  id: string;
  salesDayId: string;
  customerId: string;
  status: SaleStatus;
  invoiceNumber: string | null;
  invoiceBusinessDate: string | null;
  items: SaleItemPrimitives[];
  totalAmount: number;
  totalProfit: number;
  totalQuantity: number;
  createdAt: string;
  confirmedAt: string | null;
  voidedAt: string | null;
};

export class Sale {
  private constructor(
    readonly id: string,
    readonly salesDayId: string,
    readonly customerId: string,
    private _status: SaleStatus,
    private _invoiceNumber: string | null,
    private _invoiceBusinessDate: string | null,
    private _items: SaleItem[],
    readonly createdAt: Date,
    private _confirmedAt: Date | null,
    private _voidedAt: Date | null
  ) {}

  get status(): SaleStatus {
    return this._status;
  }

  get invoiceNumber(): string | null {
    return this._invoiceNumber;
  }

  get invoiceBusinessDate(): string | null {
    return this._invoiceBusinessDate;
  }

  get items(): SaleItem[] {
    return [...this._items];
  }

  get confirmedAt(): Date | null {
    return this._confirmedAt;
  }

  get voidedAt(): Date | null {
    return this._voidedAt;
  }

  get totalAmount(): number {
    const sum = this._items.reduce((acc, item) => acc + item.totalPrice, 0);
    return Math.round(sum * 100) / 100;
  }

  get totalProfit(): number {
    const sum = this._items.reduce((acc, item) => acc + item.profit, 0);
    return Math.round(sum * 100) / 100;
  }

  get totalQuantity(): number {
    return this._items.reduce((acc, item) => acc + item.quantity, 0);
  }

  isDraft(): boolean {
    return this._status === 'DRAFT';
  }

  isConfirmed(): boolean {
    return this._status === 'CONFIRMED';
  }

  isVoided(): boolean {
    return this._status === 'VOIDED';
  }

  static create(params: {
    id: string;
    salesDayId: string;
    customerId: string;
    status?: SaleStatus;
    invoiceNumber?: string | null;
    invoiceBusinessDate?: string | null;
    items?: SaleItem[];
    createdAt?: Date;
    confirmedAt?: Date | null;
    voidedAt?: Date | null;
  }): Sale {
    const trimmedId = params.id?.trim();
    if (!trimmedId) {
      throw new InvalidSaleError('Sale id cannot be empty');
    }

    const trimmedSalesDayId = params.salesDayId?.trim();
    if (!trimmedSalesDayId) {
      throw new InvalidSaleError('Sales day id cannot be empty');
    }

    const trimmedCustomerId = params.customerId?.trim();
    if (!trimmedCustomerId) {
      throw new InvalidSaleError('Customer id cannot be empty');
    }

    const status = params.status ?? 'DRAFT';
    const invoiceNumber = params.invoiceNumber ? params.invoiceNumber.trim() : null;
    const invoiceBusinessDate = params.invoiceBusinessDate ? params.invoiceBusinessDate.trim() : null;
    const items = params.items ? [...params.items] : [];
    const createdAt = params.createdAt ?? new Date();
    const confirmedAt = params.confirmedAt ?? null;
    const voidedAt = params.voidedAt ?? null;

    return new Sale(
      trimmedId,
      trimmedSalesDayId,
      trimmedCustomerId,
      status,
      invoiceNumber,
      invoiceBusinessDate,
      items,
      createdAt,
      confirmedAt,
      voidedAt
    );
  }

  addItem(newItem: SaleItem): Sale {
    this.assertNotVoided();

    const existingIndex = this._items.findIndex((item) => item.productId === newItem.productId);
    let updatedItems: SaleItem[];

    if (existingIndex >= 0) {
      const existing = this._items[existingIndex];
      const combinedQuantity = existing.quantity + newItem.quantity;
      const updatedItem = existing.updateQuantity(combinedQuantity);
      updatedItems = [...this._items];
      updatedItems[existingIndex] = updatedItem;
    } else {
      updatedItems = [...this._items, newItem];
    }

    return new Sale(
      this.id,
      this.salesDayId,
      this.customerId,
      this._status,
      this._invoiceNumber,
      this._invoiceBusinessDate,
      updatedItems,
      this.createdAt,
      this._confirmedAt,
      this._voidedAt
    );
  }

  updateItemQuantity(productId: string, quantity: number): Sale {
    this.assertNotVoided();

    const existingIndex = this._items.findIndex((item) => item.productId === productId);
    if (existingIndex < 0) {
      throw new InvalidSaleError(`Product "${productId}" is not in this sale`);
    }

    const updatedItem = this._items[existingIndex].updateQuantity(quantity);
    const updatedItems = [...this._items];
    updatedItems[existingIndex] = updatedItem;

    return new Sale(
      this.id,
      this.salesDayId,
      this.customerId,
      this._status,
      this._invoiceNumber,
      this._invoiceBusinessDate,
      updatedItems,
      this.createdAt,
      this._confirmedAt,
      this._voidedAt
    );
  }

  updateItemName(productId: string, itemName: string): Sale {
    this.ensureIsDraft();

    const existingIndex = this._items.findIndex((item) => item.productId === productId);
    if (existingIndex < 0) {
      throw new InvalidSaleError(`Product "${productId}" is not in this sale`);
    }

    const updatedItem = this._items[existingIndex].updateItemName(itemName);
    const updatedItems = [...this._items];
    updatedItems[existingIndex] = updatedItem;

    return new Sale(
      this.id,
      this.salesDayId,
      this.customerId,
      this._status,
      this._invoiceNumber,
      this._invoiceBusinessDate,
      updatedItems,
      this.createdAt,
      this._confirmedAt,
      this._voidedAt
    );
  }

  removeItem(productId: string): Sale {
    this.assertNotVoided();

    const existingIndex = this._items.findIndex((item) => item.productId === productId);
    if (existingIndex < 0) {
      throw new InvalidSaleError(`Product "${productId}" is not in this sale`);
    }

    if (this.isConfirmed() && this._items.length === 1) {
      throw new SaleMustContainItemsError('A confirmed sale must contain at least one item');
    }

    const updatedItems = this._items.filter((item) => item.productId !== productId);

    return new Sale(
      this.id,
      this.salesDayId,
      this.customerId,
      this._status,
      this._invoiceNumber,
      this._invoiceBusinessDate,
      updatedItems,
      this.createdAt,
      this._confirmedAt,
      this._voidedAt
    );
  }

  confirm(invoiceNumber: string, businessDate: string): Sale {
    this.ensureIsDraft();

    if (this._items.length === 0) {
      throw new SaleMustContainItemsError();
    }

    const trimmedInvoice = invoiceNumber?.trim();
    if (!trimmedInvoice) {
      throw new InvalidSaleError('Invoice number cannot be empty upon confirmation');
    }

    const trimmedDate = businessDate?.trim();
    if (!trimmedDate) {
      throw new InvalidSaleError('Invoice business date cannot be empty upon confirmation');
    }

    return new Sale(
      this.id,
      this.salesDayId,
      this.customerId,
      'CONFIRMED',
      trimmedInvoice,
      trimmedDate,
      this._items,
      this.createdAt,
      new Date(),
      null
    );
  }

  void(): Sale {
    if (this._status === 'VOIDED') {
      throw new SaleAlreadyVoidedError(this.id);
    }

    if (this._status === 'DRAFT') {
      throw new SaleCannotBeModifiedError('Cannot void a sale that is still in DRAFT status');
    }

    return new Sale(
      this.id,
      this.salesDayId,
      this.customerId,
      'VOIDED',
      this._invoiceNumber,
      this._invoiceBusinessDate,
      this._items,
      this.createdAt,
      this._confirmedAt,
      new Date()
    );
  }

  toPrimitives(): SalePrimitives {
    return {
      id: this.id,
      salesDayId: this.salesDayId,
      customerId: this.customerId,
      status: this._status,
      invoiceNumber: this._invoiceNumber,
      invoiceBusinessDate: this._invoiceBusinessDate,
      items: this._items.map((item) => item.toPrimitives()),
      totalAmount: this.totalAmount,
      totalProfit: this.totalProfit,
      totalQuantity: this.totalQuantity,
      createdAt: this.createdAt.toISOString(),
      confirmedAt: this._confirmedAt ? this._confirmedAt.toISOString() : null,
      voidedAt: this._voidedAt ? this._voidedAt.toISOString() : null
    };
  }

  private ensureIsDraft(): void {
    if (this._status === 'CONFIRMED') {
      throw new SaleCannotBeModifiedError('Confirmed sale item name cannot be modified');
    }
    if (this._status === 'VOIDED') {
      throw new SaleAlreadyVoidedError(this.id);
    }
  }

  private assertNotVoided(): void {
    if (this._status === 'VOIDED') {
      throw new SaleAlreadyVoidedError(this.id);
    }
  }
}
