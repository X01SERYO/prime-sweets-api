export interface SalesDayBusinessDateQuery {
  findOpenBusinessDate(salesDayId: string): Promise<string | null>;
}
