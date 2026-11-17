import { MigrationInterface, QueryRunner } from 'typeorm';

export class InvoiceNumberByDeliveryDate1760000000021 implements MigrationInterface {
  name = 'InvoiceNumberByDeliveryDate1760000000021';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_sales_invoice_business_date_number"`);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_sales_delivery_date_invoice_number"
      ON "sales" ("delivery_date", "invoice_number")
      WHERE "invoice_number" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_sales_delivery_date_invoice_number"`);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_sales_invoice_business_date_number"
      ON "sales" ("invoice_business_date", "invoice_number")
      WHERE "invoice_number" IS NOT NULL
    `);
  }
}
