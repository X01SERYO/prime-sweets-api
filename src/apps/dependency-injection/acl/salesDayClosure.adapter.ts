import { SalesDayRepository } from '../../../contexts/sales-day/application/ports/outbound/salesDay.repository';
import {
  SalesDayClosureQuery,
  SalesDayClosureView
} from '../../../contexts/fulfillment-output/application/ports/outbound/salesDayClosureQuery.port';

export class SalesDayClosureAdapter implements SalesDayClosureQuery {
  constructor(private readonly salesDayRepository: SalesDayRepository) {}

  async findById(salesDayId: string): Promise<SalesDayClosureView | null> {
    const salesDay = await this.salesDayRepository.findById(salesDayId);
    if (!salesDay) {
      return null;
    }

    const primitives = salesDay.toPrimitives();
    return {
      id: primitives.id,
      status: primitives.status
    };
  }
}
