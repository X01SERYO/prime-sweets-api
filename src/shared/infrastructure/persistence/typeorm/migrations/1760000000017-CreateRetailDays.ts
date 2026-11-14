import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRetailDays1760000000017 implements MigrationInterface {
  name = 'CreateRetailDays1760000000017';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "retail_days" (
        "id" uuid NOT NULL,
        "business_date" date NOT NULL,
        "status" character varying(20) NOT NULL DEFAULT 'UNREVIEWED',
        "total_amount" numeric(12,2) NOT NULL DEFAULT 0,
        "total_profit" numeric(12,2) NOT NULL DEFAULT 0,
        "open_items" jsonb,
        "reviewed_at" TIMESTAMPTZ,
        "reviewed_by" uuid,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_retail_days" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_retail_days_business_date" UNIQUE ("business_date"),
        CONSTRAINT "CHK_retail_days_status" CHECK ("status" IN ('UNREVIEWED', 'REVIEWED')),
        CONSTRAINT "FK_retail_days_reviewed_by" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_retail_days_status_business_date"
      ON "retail_days" ("status", "business_date" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_retail_days_open_draft"
      ON "retail_days" ("business_date")
      WHERE "open_items" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_retail_days_open_draft"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_retail_days_status_business_date"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "retail_days"`);
  }
}
