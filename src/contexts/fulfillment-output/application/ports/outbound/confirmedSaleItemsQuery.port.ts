import { ConfirmedSaleItemContribution } from '@/contexts/fulfillment-output/domain/entities/loadSheet';

export interface ConfirmedSaleItemsQuery {
  findConfirmedByDeliveryDate(deliveryDate: string): Promise<ConfirmedSaleItemContribution[]>;
}
