import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProducts1760000000002 implements MigrationInterface {
  name = 'CreateProducts1760000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "products" (
        "id" uuid NOT NULL,
        "alegra_id" character varying(64) NOT NULL,
        "brand_id" uuid,
        "name" character varying(255),
        "suggested_price" numeric(12,2),
        "units" integer NOT NULL DEFAULT 0,
        "pack" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_products" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_products_alegra_id" UNIQUE ("alegra_id"),
        CONSTRAINT "FK_products_brand_id" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_products_brand_id" ON "products" ("brand_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_products_brand_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "products"`);
  }
}
