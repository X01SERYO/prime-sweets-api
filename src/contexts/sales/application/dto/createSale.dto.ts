export type CreateSaleItemDto = {
  productId: string;
  itemName?: string;
  quantity: number;
};

export type CreateSaleDto = {
  salesDayId: string;
  customerId: string;
  deliveryDate: string;
  items?: CreateSaleItemDto[];
};
