import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductPrices1760000000003 implements MigrationInterface {
  name = 'CreateProductPrices1760000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "product_prices" (
        "id" uuid NOT NULL,
        "product_id" uuid NOT NULL,
        "channel" character varying(20) NOT NULL,
        "cost" numeric(12,2),
        "price" numeric(12,2) NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_product_prices" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_product_prices_product_channel" UNIQUE ("product_id", "channel"),
        CONSTRAINT "CHK_product_prices_channel" CHECK ("channel" IN ('wholesale', 'retail')),
        CONSTRAINT "FK_product_prices_product_id" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "product_prices"`);
  }
}
