export type SalesDayEditGate =
  | { kind: 'editable'; date: string }
  | { kind: 'closed' }
  | { kind: 'outside' }
  | { kind: 'missing' };

export interface SalesDayStatusChecker {
  findForEdit(salesDayId: string): Promise<SalesDayEditGate>;
}
