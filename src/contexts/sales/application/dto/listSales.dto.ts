export type ListSalesDto = {
  salesDayId?: string;
  customerId?: string;
  deliveryDate?: string;
  status?: 'DRAFT' | 'CONFIRMED' | 'VOIDED';
};
