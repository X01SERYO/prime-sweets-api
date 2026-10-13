import { DataSource, Repository } from 'typeorm';
import { InvoiceNumberAllocator } from '../../../../application/ports/outbound/invoiceNumberAllocator.port';
import { InvoiceSequenceEntity } from '../invoiceSequence.entity';

export class TypeOrmInvoiceNumberAllocator implements InvoiceNumberAllocator {
  constructor(private readonly dataSource: DataSource) {}

  private get repository(): Repository<InvoiceSequenceEntity> {
    return this.dataSource.getRepository(InvoiceSequenceEntity);
  }

  async allocateNext(): Promise<string> {
    return await this.repository.manager.transaction(async (trx) => {
      const rawResult = await trx.query(`
        INSERT INTO "invoice_sequences" ("id", "current_value", "prefix", "updated_at")
        VALUES ('default', 1, 'INV-', now())
        ON CONFLICT ("id") DO UPDATE
        SET "current_value" = "invoice_sequences"."current_value" + 1,
            "updated_at" = now()
        RETURNING "current_value", "prefix";
      `);

      const nextVal = rawResult[0]?.current_value ?? 1;
      const prefix = rawResult[0]?.prefix ?? 'INV-';
      return `${prefix}${String(nextVal).padStart(5, '0')}`;
    });
  }
}
