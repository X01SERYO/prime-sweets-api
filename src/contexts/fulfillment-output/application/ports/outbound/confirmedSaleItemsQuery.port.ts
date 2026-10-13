import { ConfirmedSaleItemContribution } from '../../../domain/entities/loadSheet';

export interface ConfirmedSaleItemsQuery {
  findConfirmedBySalesDayId(salesDayId: string): Promise<ConfirmedSaleItemContribution[]>;
}
