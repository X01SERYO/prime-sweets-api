import { MigrationInterface, QueryRunner } from 'typeorm';

export class UniqueCustomerDocument1760000000007 implements MigrationInterface {
  name = 'UniqueCustomerDocument1760000000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_customers_document"`);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_customers_document"
      ON "customers" (LOWER("document_type"), "document_number")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_customers_document"`);
    await queryRunner.query(`
      CREATE INDEX "IDX_customers_document" ON "customers" ("document_type", "document_number")
    `);
  }
}
