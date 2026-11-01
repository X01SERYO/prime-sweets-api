import { SaleItem, SaleItemPrimitives } from './saleItem';
import { InvalidSaleError } from '../errors/invalidSale.error';
import { SaleMustContainItemsError } from '../errors/saleMustContainItems.error';
import { SaleCannotBeModifiedError } from '../errors/saleCannotBeModified.error';
import { SaleAlreadyVoidedError } from '../errors/saleAlreadyVoided.error';
import { assertDeliveryDateAllowed, normalizeBusinessDate } from '../services/deliveryDateRange';

function newestFirst(items: SaleItem[]): SaleItem[] {
  return [...items].sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
}

export type SaleStatus = 'DRAFT' | 'CONFIRMED' | 'VOIDED';

export type SalePrimitives = {
  id: string;
  sellerId: string;
  customerId: string;
  captureDate: string;
  deliveryDate: string;
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

type SaleState = {
  deliveryDate: string;
  status: SaleStatus;
  invoiceNumber: string | null;
  invoiceBusinessDate: string | null;
  items: SaleItem[];
  confirmedAt: Date | null;
  voidedAt: Date | null;
};

export class Sale {
  private constructor(
    readonly id: string,
    readonly sellerId: string,
    readonly customerId: string,
    readonly captureDate: string,
    readonly createdAt: Date,
    private readonly state: SaleState
  ) {}

  get deliveryDate(): string {
    return this.state.deliveryDate;
  }

  get status(): SaleStatus {
    return this.state.status;
  }

  get invoiceNumber(): string | null {
    return this.state.invoiceNumber;
  }

  get invoiceBusinessDate(): string | null {
    return this.state.invoiceBusinessDate;
  }

  get items(): SaleItem[] {
    return newestFirst(this.state.items);
  }

  get confirmedAt(): Date | null {
    return this.state.confirmedAt;
  }

  get voidedAt(): Date | null {
    return this.state.voidedAt;
  }

  get totalAmount(): number {
    const sum = this.state.items.reduce((acc, item) => acc + item.totalPrice, 0);
    return Math.round(sum * 100) / 100;
  }

  get totalProfit(): number {
    const sum = this.state.items.reduce((acc, item) => acc + item.profit, 0);
    return Math.round(sum * 100) / 100;
  }

  get totalQuantity(): number {
    return this.state.items.reduce((acc, item) => acc + item.quantity, 0);
  }

  isDraft(): boolean {
    return this.state.status === 'DRAFT';
  }

  isConfirmed(): boolean {
    return this.state.status === 'CONFIRMED';
  }

  isVoided(): boolean {
    return this.state.status === 'VOIDED';
  }

  static start(params: {
    id: string;
    sellerId: string;
    customerId: string;
    deliveryDate: string;
    today: string;
  }): Sale {
    const today = normalizeBusinessDate(params.today);
    return Sale.create({
      id: params.id,
      sellerId: params.sellerId,
      customerId: params.customerId,
      captureDate: today,
      deliveryDate: assertDeliveryDateAllowed(params.deliveryDate, today)
    });
  }

  static create(params: {
    id: string;
    sellerId: string;
    customerId: string;
    captureDate: string;
    deliveryDate: string;
    status?: SaleStatus;
    invoiceNumber?: string | null;
    invoiceBusinessDate?: string | null;
    items?: SaleItem[];
    createdAt?: Date;
    confirmedAt?: Date | null;
    voidedAt?: Date | null;
  }): Sale {
    const id = params.id?.trim();
    if (!id) {
      throw new InvalidSaleError('Sale id cannot be empty');
    }

    const sellerId = params.sellerId?.trim();
    if (!sellerId) {
      throw new InvalidSaleError('Seller id cannot be empty');
    }

    const customerId = params.customerId?.trim();
    if (!customerId) {
      throw new InvalidSaleError('Customer id cannot be empty');
    }

    return new Sale(id, sellerId, customerId, normalizeBusinessDate(params.captureDate), params.createdAt ?? new Date(), {
      deliveryDate: normalizeBusinessDate(params.deliveryDate),
      status: params.status ?? 'DRAFT',
      invoiceNumber: params.invoiceNumber ? params.invoiceNumber.trim() : null,
      invoiceBusinessDate: params.invoiceBusinessDate ? params.invoiceBusinessDate.trim() : null,
      items: params.items ? newestFirst(params.items) : [],
      confirmedAt: params.confirmedAt ?? null,
      voidedAt: params.voidedAt ?? null
    });
  }

  addItem(newItem: SaleItem): Sale {
    this.assertNotVoided();

    const sameName = newItem.itemName.trim().toLocaleLowerCase();
    const existingIndex = this.state.items.findIndex(
      (item) => item.productId === newItem.productId && item.itemName.trim().toLocaleLowerCase() === sameName
    );
    const items = [...this.state.items];

    if (existingIndex >= 0) {
      const existing = items[existingIndex];
      items[existingIndex] = existing.updateQuantity(existing.quantity + newItem.quantity);
    } else {
      items.push(newItem);
    }

    return this.with({ items });
  }

  updateItemQuantity(itemId: string, quantity: number): Sale {
    this.assertNotVoided();
    const index = this.indexOfItem(itemId);
    const items = [...this.state.items];
    items[index] = items[index].updateQuantity(quantity);
    return this.with({ items });
  }

  updateItemName(itemId: string, itemName: string): Sale {
    this.ensureIsDraft();
    const index = this.indexOfItem(itemId);
    const items = [...this.state.items];
    items[index] = items[index].updateItemName(itemName);
    return this.with({ items });
  }

  removeItem(itemId: string): Sale {
    this.assertNotVoided();
    this.indexOfItem(itemId);

    if (this.isConfirmed() && this.state.items.length === 1) {
      throw new SaleMustContainItemsError('A confirmed sale must contain at least one item');
    }

    return this.with({ items: this.state.items.filter((item) => item.id !== itemId) });
  }

  setDeliveryDate(deliveryDate: string, today: string): Sale {
    this.assertNotVoided();
    return this.with({ deliveryDate: assertDeliveryDateAllowed(deliveryDate, normalizeBusinessDate(today)) });
  }

  confirm(invoiceNumber: string, businessDate: string): Sale {
    this.ensureIsDraft();

    if (this.state.items.length === 0) {
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

    return this.with({
      status: 'CONFIRMED',
      invoiceNumber: trimmedInvoice,
      invoiceBusinessDate: trimmedDate,
      confirmedAt: new Date(),
      voidedAt: null
    });
  }

  void(): Sale {
    this.assertNotVoided();
    return this.with({ status: 'VOIDED', voidedAt: new Date() });
  }

  toPrimitives(): SalePrimitives {
    return {
      id: this.id,
      sellerId: this.sellerId,
      customerId: this.customerId,
      captureDate: this.captureDate,
      deliveryDate: this.state.deliveryDate,
      status: this.state.status,
      invoiceNumber: this.state.invoiceNumber,
      invoiceBusinessDate: this.state.invoiceBusinessDate,
      items: this.items.map((item) => item.toPrimitives()),
      totalAmount: this.totalAmount,
      totalProfit: this.totalProfit,
      totalQuantity: this.totalQuantity,
      createdAt: this.createdAt.toISOString(),
      confirmedAt: this.state.confirmedAt ? this.state.confirmedAt.toISOString() : null,
      voidedAt: this.state.voidedAt ? this.state.voidedAt.toISOString() : null
    };
  }

  private with(changes: Partial<SaleState>): Sale {
    return new Sale(this.id, this.sellerId, this.customerId, this.captureDate, this.createdAt, {
      ...this.state,
      ...changes
    });
  }

  private indexOfItem(itemId: string): number {
    const index = this.state.items.findIndex((item) => item.id === itemId);
    if (index < 0) {
      throw new InvalidSaleError(`Sale item "${itemId}" is not in this sale`);
    }
    return index;
  }

  private ensureIsDraft(): void {
    if (this.state.status === 'CONFIRMED') {
      throw new SaleCannotBeModifiedError('Confirmed sale item name cannot be modified');
    }
    this.assertNotVoided();
  }

  private assertNotVoided(): void {
    if (this.state.status === 'VOIDED') {
      throw new SaleAlreadyVoidedError(this.id);
    }
  }
}
