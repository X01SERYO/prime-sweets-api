import { InvalidSalesDayError } from '../errors/invalidSalesDay.error';
import { SalesDayAlreadyClosedError } from '../errors/salesDayAlreadyClosedError';
import { SalesDayAlreadyOpenError } from '../errors/salesDayAlreadyOpenError';
import { SalesDayCannotBeReopenedError } from '../errors/salesDayCannotBeReopenedError';

export type SalesDayStatus = 'OPEN' | 'CLOSED';

export type SalesDayPrimitives = {
  id: string;
  sellerId: string;
  date: string;
  status: SalesDayStatus;
  openedAt: string;
  closedAt: string | null;
};

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export class SalesDay {
  constructor(
    readonly id: string,
    private _sellerId: string,
    private _date: string,
    private _status: SalesDayStatus,
    private _openedAt: Date,
    private _closedAt: Date | null
  ) {}

  get sellerId(): string {
    return this._sellerId;
  }

  get date(): string {
    return this._date;
  }

  get status(): SalesDayStatus {
    return this._status;
  }

  get openedAt(): Date {
    return this._openedAt;
  }

  get closedAt(): Date | null {
    return this._closedAt;
  }

  isOpen(): boolean {
    return this._status === 'OPEN';
  }

  isClosed(): boolean {
    return this._status === 'CLOSED';
  }

  static create(params: {
    id: string;
    sellerId: string;
    date: string;
    status?: SalesDayStatus;
    openedAt?: Date;
    closedAt?: Date | null;
  }): SalesDay {
    const trimmedId = params.id?.trim();
    if (!trimmedId) {
      throw new InvalidSalesDayError('Sales Day id cannot be empty');
    }

    const trimmedSellerId = params.sellerId?.trim();
    if (!trimmedSellerId) {
      throw new InvalidSalesDayError('Sales Day sellerId cannot be empty');
    }

    const trimmedDate = params.date?.trim();
    if (!trimmedDate || !DATE_REGEX.test(trimmedDate)) {
      throw new InvalidSalesDayError(`Sales Day date must be in YYYY-MM-DD format (received "${params.date}")`);
    }

    const status = params.status ?? 'OPEN';
    const openedAt = params.openedAt ?? new Date();
    const closedAt = params.closedAt ?? null;

    return new SalesDay(trimmedId, trimmedSellerId, trimmedDate, status, openedAt, closedAt);
  }

  close(): SalesDay {
    if (this._status === 'CLOSED') {
      throw new SalesDayAlreadyClosedError();
    }

    return new SalesDay(
      this.id,
      this._sellerId,
      this._date,
      'CLOSED',
      this._openedAt,
      new Date()
    );
  }

  reopen(currentBusinessDate: string): SalesDay {
    if (this._status === 'OPEN') {
      throw new SalesDayAlreadyOpenError();
    }

    const sanitizedCurrentDate = currentBusinessDate?.trim();
    if (this._date !== sanitizedCurrentDate) {
      throw new SalesDayCannotBeReopenedError(
        `Cannot reopen Sales Day for historical date "${this._date}". Current date is "${sanitizedCurrentDate}"`
      );
    }

    return new SalesDay(
      this.id,
      this._sellerId,
      this._date,
      'OPEN',
      this._openedAt,
      null
    );
  }

  toPrimitives(): SalesDayPrimitives {
    return {
      id: this.id,
      sellerId: this._sellerId,
      date: this._date,
      status: this._status,
      openedAt: this._openedAt.toISOString(),
      closedAt: this._closedAt ? this._closedAt.toISOString() : null
    };
  }
}
