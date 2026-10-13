export interface BusinessDateProvider {
  getCurrentDate(): string;
}

export class ColombianBusinessDateProvider implements BusinessDateProvider {
  constructor(private readonly timeZone = process.env.BUSINESS_TIMEZONE || 'America/Bogota') {}

  getCurrentDate(): string {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: this.timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return formatter.format(new Date());
  }
}
