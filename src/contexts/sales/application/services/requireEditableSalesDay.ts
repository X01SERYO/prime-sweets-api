import { SaleOutsideEditWindowError } from '../../domain/errors/saleOutsideEditWindow.error';
import { SalesDayNotOpenForSaleError } from '../../domain/errors/salesDayNotOpenForSale.error';
import { SalesDayStatusChecker } from '../ports/outbound/salesDayStatusChecker.port';

export async function requireEditableSalesDay(
  checker: SalesDayStatusChecker,
  salesDayId: string
): Promise<{ date: string } | Error> {
  const gate = await checker.findForEdit(salesDayId);
  if (gate.kind === 'missing') {
    return new SalesDayNotOpenForSaleError(salesDayId);
  }
  if (gate.kind === 'outside') {
    return new SaleOutsideEditWindowError();
  }
  if (gate.kind === 'closed') {
    return new SalesDayNotOpenForSaleError(salesDayId);
  }
  return { date: gate.date };
}
