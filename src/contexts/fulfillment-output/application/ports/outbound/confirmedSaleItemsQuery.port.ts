import { ConfirmedSaleItemContribution } from '../../../domain/entities/loadSheet';

export interface ConfirmedSaleItemsQuery {
  findConfirmedByDeliveryDate(deliveryDate: string): Promise<ConfirmedSaleItemContribution[]>;
}
