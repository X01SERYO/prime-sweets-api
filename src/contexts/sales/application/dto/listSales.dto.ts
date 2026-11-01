export type ListSalesDto = {
  customerId?: string;
  deliveryDate?: string;
  status?: 'DRAFT' | 'CONFIRMED' | 'VOIDED';
};
