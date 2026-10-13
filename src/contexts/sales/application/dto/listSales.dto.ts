export type ListSalesDto = {
  salesDayId?: string;
  customerId?: string;
  status?: 'DRAFT' | 'CONFIRMED' | 'VOIDED';
};
