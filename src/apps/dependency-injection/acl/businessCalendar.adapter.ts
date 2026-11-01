import { BusinessCalendar } from '../../../contexts/sales/application/ports/outbound/businessCalendar.port';

type BusinessDateProvider = { getCurrentDate(): string };

export class BusinessCalendarAdapter implements BusinessCalendar {
  constructor(private readonly dateProvider: BusinessDateProvider) {}

  today(): string {
    return this.dateProvider.getCurrentDate();
  }
}
