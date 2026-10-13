import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSalesDays1760000000005 implements MigrationInterface {
  name = 'CreateSalesDays1760000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "sales_days" (
        "id" uuid NOT NULL,
        "seller_id" character varying(64) NOT NULL,
        "date" character varying(10) NOT NULL,
        "status" character varying(10) NOT NULL DEFAULT 'OPEN',
        "opened_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "closed_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sales_days" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_sales_days_seller_date" UNIQUE ("seller_id", "date"),
        CONSTRAINT "CHK_sales_days_status" CHECK ("status" IN ('OPEN', 'CLOSED'))
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_sales_days_seller_date" ON "sales_days" ("seller_id", "date")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_sales_days_seller_date"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sales_days"`);
  }
}
