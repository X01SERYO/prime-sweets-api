import { BusinessCalendar } from '@/shared/application/ports/businessCalendar';

type BusinessDateProvider = { getCurrentDate(): string };

export class BusinessCalendarAdapter implements BusinessCalendar {
  constructor(private readonly dateProvider: BusinessDateProvider) {}

  today(): string {
    return this.dateProvider.getCurrentDate();
  }
}
