import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePurchasing1760000000018 implements MigrationInterface {
  name = 'CreatePurchasing1760000000018';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "suppliers" (
        "id" uuid NOT NULL,
        "name" character varying(120) NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_suppliers" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "supplier_products" (
        "supplier_id" uuid NOT NULL,
        "product_id" uuid NOT NULL,
        "last_quantity" integer,
        "last_unit_cost" numeric(12,2),
        "last_item_name" character varying(255),
        CONSTRAINT "PK_supplier_products" PRIMARY KEY ("supplier_id", "product_id"),
        CONSTRAINT "FK_supplier_products_supplier" FOREIGN KEY ("supplier_id")
          REFERENCES "suppliers"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "purchase_orders" (
        "id" uuid NOT NULL,
        "supplier_id" uuid NOT NULL,
        "line_count" integer NOT NULL,
        "total_cost" numeric(14,2) NOT NULL,
        "lines" jsonb,
        "created_at" TIMESTAMPTZ NOT NULL,
        CONSTRAINT "PK_purchase_orders" PRIMARY KEY ("id"),
        CONSTRAINT "FK_purchase_orders_supplier" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_purchase_orders_supplier_created"
      ON "purchase_orders" ("supplier_id", "created_at" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_purchase_orders_open_lines"
      ON "purchase_orders" ("supplier_id")
      WHERE "lines" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_purchase_orders_open_lines"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_purchase_orders_supplier_created"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "purchase_orders"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "supplier_products"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "suppliers"`);
  }
}
