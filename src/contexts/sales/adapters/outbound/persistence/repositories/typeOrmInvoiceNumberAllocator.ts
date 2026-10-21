import { DataSource } from 'typeorm';
import { formatDailyInvoiceNumber } from '../../../../domain/services/dailyInvoiceNumber';
import { InvoiceNumberAllocator } from '../../../../application/ports/outbound/invoiceNumberAllocator.port';

export class TypeOrmInvoiceNumberAllocator implements InvoiceNumberAllocator {
  constructor(private readonly dataSource: DataSource) {}

  async allocateNext(businessDate: string): Promise<string> {
    const rawResult = await this.dataSource.transaction(async (trx) => {
      return trx.query(
        `
        INSERT INTO "invoice_sequences" ("id", "current_value", "prefix", "updated_at")
        VALUES ($1, 1, '', now())
        ON CONFLICT ("id") DO UPDATE
        SET "current_value" = "invoice_sequences"."current_value" + 1,
            "updated_at" = now()
        RETURNING "current_value";
        `,
        [businessDate]
      );
    });

    return formatDailyInvoiceNumber(Number(rawResult[0]?.current_value));
  }
}
