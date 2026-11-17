import { DataSource } from 'typeorm';
import { formatDailyInvoiceNumber } from '@/contexts/sales/domain/services/dailyInvoiceNumber';
import { InvoiceNumberAllocator } from '@/contexts/sales/application/ports/outbound/invoiceNumberAllocator.port';

export class TypeOrmInvoiceNumberAllocator implements InvoiceNumberAllocator {
  constructor(private readonly dataSource: DataSource) {}

  async allocateNext(businessDate: string): Promise<string> {
    const rawResult = await this.dataSource.transaction(async (trx) => {
      return trx.query(
        `
        WITH used AS (
          SELECT COALESCE(MAX(CAST("invoice_number" AS integer)), 0) AS max_number
          FROM "sales"
          WHERE "delivery_date" = $1::date
            AND "invoice_number" ~ '^[0-9]+$'
        )
        INSERT INTO "invoice_sequences" ("id", "current_value", "prefix", "updated_at")
        SELECT $1, used.max_number + 1, '', now() FROM used
        ON CONFLICT ("id") DO UPDATE
        SET "current_value" = GREATEST("invoice_sequences"."current_value", (SELECT max_number FROM used)) + 1,
            "updated_at" = now()
        RETURNING "current_value";
        `,
        [businessDate]
      );
    });

    return formatDailyInvoiceNumber(Number(rawResult[0]?.current_value));
  }
}
