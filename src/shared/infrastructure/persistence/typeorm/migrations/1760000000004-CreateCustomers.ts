import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCustomers1760000000004 implements MigrationInterface {
  name = 'CreateCustomers1760000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "customers" (
        "id" uuid NOT NULL,
        "document_type" character varying(32) NOT NULL,
        "document_number" character varying(64) NOT NULL,
        "name" character varying(255) NOT NULL,
        "phone" character varying(64),
        "email" character varying(255),
        "address" character varying(255),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_customers" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_customers_document" ON "customers" ("document_type", "document_number")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_customers_document"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "customers"`);
  }
}
