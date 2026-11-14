import { RetailDayItem, RetailProductSnapshot } from './retailDayItem';
import { RetailDayAlreadyReviewedError } from '@/contexts/retail-sales/domain/errors/retailDayAlreadyReviewed.error';
import { RetailDayClosedError } from '@/contexts/retail-sales/domain/errors/retailDayClosed.error';
import { RetailItemNotFoundError } from '@/contexts/retail-sales/domain/errors/retailItemNotFound.error';

export enum RetailDayStatus {
  Unreviewed = 'UNREVIEWED',
  Reviewed = 'REVIEWED',
}

export type RetailDayPrimitives = {
  id: string;
  businessDate: string;
  status: RetailDayStatus;
  totalAmount: number;
  totalProfit: number;
  items: ReturnType<RetailDayItem['toPrimitives']>[];
  reviewedAt: string | null;
  reviewedBy: string | null;
};

type RetailDayState = {
  status: RetailDayStatus;
  items: RetailDayItem[];
  totalAmount: number;
  totalProfit: number;
  reviewedAt: Date | null;
  reviewedBy: string | null;
};

export class RetailDay {
  private constructor(
    readonly id: string,
    readonly businessDate: string,
    private readonly state: RetailDayState
  ) {}

  get status(): RetailDayStatus {
    return this.state.status;
  }

  get items(): RetailDayItem[] {
    return [...this.state.items];
  }

  get totalAmount(): number {
    return this.state.totalAmount;
  }

  get totalProfit(): number {
    return this.state.totalProfit;
  }

  get reviewedAt(): Date | null {
    return this.state.reviewedAt;
  }

  get reviewedBy(): string | null {
    return this.state.reviewedBy;
  }

  isEditable(today: string): boolean {
    return this.businessDate === today && this.state.status === RetailDayStatus.Unreviewed;
  }

  static create(id: string, today: string): RetailDay {
    return new RetailDay(id, today, {
      status: RetailDayStatus.Unreviewed,
      items: [],
      totalAmount: 0,
      totalProfit: 0,
      reviewedAt: null,
      reviewedBy: null,
    });
  }

  static rehydrate(params: {
    id: string;
    businessDate: string;
    status: RetailDayStatus;
    items: RetailDayItem[];
    totalAmount: number;
    totalProfit: number;
    reviewedAt: Date | null;
    reviewedBy: string | null;
  }): RetailDay {
    return new RetailDay(params.id, params.businessDate, {
      status: params.status,
      items: params.items,
      totalAmount: params.totalAmount,
      totalProfit: params.totalProfit,
      reviewedAt: params.reviewedAt,
      reviewedBy: params.reviewedBy,
    });
  }

  addProduct(snapshot: RetailProductSnapshot, quantity: number, today: string): RetailDay {
    this.assertEditable(today);
    const existing = this.state.items.find((item) => item.productId === snapshot.productId);
    const items = existing
      ? this.state.items.map((item) =>
          item.productId === snapshot.productId ? item.withAddedQuantity(quantity) : item
        )
      : [...this.state.items, RetailDayItem.fromSnapshot(snapshot, quantity)];
    return this.withItems(items);
  }

  setQuantity(productId: string, quantity: number, today: string): RetailDay {
    this.assertEditable(today);
    if (!this.state.items.some((item) => item.productId === productId)) {
      throw new RetailItemNotFoundError(productId);
    }
    const items = this.state.items.map((item) =>
      item.productId === productId ? item.withQuantity(quantity) : item
    );
    return this.withItems(items);
  }

  removeItem(productId: string, today: string): { day: RetailDay; becameEmpty: boolean } {
    this.assertEditable(today);
    if (!this.state.items.some((item) => item.productId === productId)) {
      throw new RetailItemNotFoundError(productId);
    }
    const items = this.state.items.filter((item) => item.productId !== productId);
    return { day: this.withItems(items), becameEmpty: items.length === 0 };
  }

  review(userId: string, now: Date): RetailDay {
    if (this.state.status === RetailDayStatus.Reviewed) {
      throw new RetailDayAlreadyReviewedError(this.businessDate);
    }
    const compacted = this.compact();
    return new RetailDay(this.id, this.businessDate, {
      ...compacted.state,
      status: RetailDayStatus.Reviewed,
      reviewedAt: now,
      reviewedBy: userId,
    });
  }

  compact(): RetailDay {
    if (this.state.items.length === 0) {
      return this;
    }
    return new RetailDay(this.id, this.businessDate, {
      ...this.state,
      items: [],
    });
  }

  toPrimitives(): RetailDayPrimitives {
    return {
      id: this.id,
      businessDate: this.businessDate,
      status: this.state.status,
      totalAmount: this.state.totalAmount,
      totalProfit: this.state.totalProfit,
      items: this.state.items.map((item) => item.toPrimitives()),
      reviewedAt: this.state.reviewedAt?.toISOString() ?? null,
      reviewedBy: this.state.reviewedBy,
    };
  }

  private assertEditable(today: string): void {
    if (!this.isEditable(today)) {
      throw new RetailDayClosedError(this.businessDate);
    }
  }

  private withItems(items: RetailDayItem[]): RetailDay {
    const totalAmount = roundMoney(items.reduce((sum, item) => sum + item.totalPrice, 0));
    const totalProfit = roundMoney(items.reduce((sum, item) => sum + item.profit, 0));
    return new RetailDay(this.id, this.businessDate, {
      ...this.state,
      items,
      totalAmount,
      totalProfit,
    });
  }
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
