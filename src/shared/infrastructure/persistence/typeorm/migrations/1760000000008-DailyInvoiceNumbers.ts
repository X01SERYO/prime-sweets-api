import { MigrationInterface, QueryRunner } from 'typeorm';

export class DailyInvoiceNumbers1760000000008 implements MigrationInterface {
  name = 'DailyInvoiceNumbers1760000000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "sales" DROP CONSTRAINT IF EXISTS "UQ_sales_invoice_number"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_sales_invoice_number"`);
    await queryRunner.query(`ALTER TABLE "sales" ADD COLUMN "invoice_business_date" character varying(10)`);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_sales_invoice_business_date_number"
      ON "sales" ("invoice_business_date", "invoice_number")
    `);
    await queryRunner.query(`DELETE FROM "invoice_sequences" WHERE "id" = 'default'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_sales_invoice_business_date_number"`);
    await queryRunner.query(`ALTER TABLE "sales" DROP COLUMN IF EXISTS "invoice_business_date"`);
    await queryRunner.query(`
      ALTER TABLE "sales" ADD CONSTRAINT "UQ_sales_invoice_number" UNIQUE ("invoice_number")
    `);
    await queryRunner.query(`CREATE INDEX "IDX_sales_invoice_number" ON "sales" ("invoice_number")`);
    await queryRunner.query(`
      INSERT INTO "invoice_sequences" ("id", "current_value", "prefix")
      VALUES ('default', 0, 'INV-')
      ON CONFLICT ("id") DO NOTHING
    `);
  }
}
