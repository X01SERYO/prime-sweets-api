import { RetailDay, RetailDayStatus } from '@/contexts/retail-sales/domain/entities/retailDay';

export type RetailDayItemView = {
  productId: string;
  productCode: string;
  brandName: string;
  productName: string;
  retailPrice: number;
  quantity: number;
  totalPrice: number;
  profit: number;
  hasCost: boolean;
};

export type RetailDayView = {
  id: string | null;
  businessDate: string;
  editable: boolean;
  status: RetailDayStatus;
  reviewedAt: string | null;
  totalAmount: number;
  totalProfit: number;
  items: RetailDayItemView[];
};

export function toRetailDayView(day: RetailDay, today: string): RetailDayView {
  const primitives = day.toPrimitives();
  return {
    id: primitives.id,
    businessDate: primitives.businessDate,
    editable: day.isEditable(today),
    status: primitives.status,
    reviewedAt: primitives.reviewedAt,
    totalAmount: primitives.totalAmount,
    totalProfit: primitives.totalProfit,
    items: primitives.items.map((item) => ({
      productId: item.productId,
      productCode: item.productCode,
      brandName: item.brandName,
      productName: item.productName,
      retailPrice: item.retailPrice,
      quantity: item.quantity,
      totalPrice: item.totalPrice,
      profit: item.profit,
      hasCost: item.hasCost,
    })),
  };
}
