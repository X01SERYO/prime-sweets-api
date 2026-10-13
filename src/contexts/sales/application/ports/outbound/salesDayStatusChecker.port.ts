export interface SalesDayStatusChecker {
  isSalesDayOpen(salesDayId: string): Promise<boolean>;
}
