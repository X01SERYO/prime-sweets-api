export type SalesDayClosureView = {
  id: string;
  status: 'OPEN' | 'CLOSED';
};

export interface SalesDayClosureQuery {
  findById(salesDayId: string): Promise<SalesDayClosureView | null>;
}
