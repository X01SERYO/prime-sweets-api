import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSalesAndInvoiceSequences1760000000006 implements MigrationInterface {
  name = 'CreateSalesAndInvoiceSequences1760000000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "sales" (
        "id" uuid NOT NULL,
        "sales_day_id" uuid NOT NULL,
        "customer_id" uuid NOT NULL,
        "status" character varying(20) NOT NULL DEFAULT 'DRAFT',
        "invoice_number" character varying(50),
        "total_amount" numeric(12,2) NOT NULL DEFAULT 0,
        "total_profit" numeric(12,2) NOT NULL DEFAULT 0,
        "total_quantity" integer NOT NULL DEFAULT 0,
        "confirmed_at" TIMESTAMPTZ,
        "voided_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sales" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_sales_invoice_number" UNIQUE ("invoice_number"),
        CONSTRAINT "CHK_sales_status" CHECK ("status" IN ('DRAFT', 'CONFIRMED', 'VOIDED')),
        CONSTRAINT "FK_sales_sales_day_id" FOREIGN KEY ("sales_day_id") REFERENCES "sales_days"("id"),
        CONSTRAINT "FK_sales_customer_id" FOREIGN KEY ("customer_id") REFERENCES "customers"("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_sales_sales_day_id" ON "sales" ("sales_day_id");
      CREATE INDEX "IDX_sales_customer_id" ON "sales" ("customer_id");
      CREATE INDEX "IDX_sales_invoice_number" ON "sales" ("invoice_number");
    `);

    await queryRunner.query(`
      CREATE TABLE "sale_items" (
        "id" uuid NOT NULL,
        "sale_id" uuid NOT NULL,
        "product_id" uuid NOT NULL,
        "item_name" character varying(255) NOT NULL,
        "quantity" integer NOT NULL,
        "wholesale_price" numeric(12,2) NOT NULL,
        "wholesale_cost" numeric(12,2) NOT NULL,
        "total_price" numeric(12,2) NOT NULL,
        "profit" numeric(12,2) NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sale_items" PRIMARY KEY ("id"),
        CONSTRAINT "FK_sale_items_sale_id" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_sale_items_product_id" FOREIGN KEY ("product_id") REFERENCES "products"("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_sale_items_sale_id" ON "sale_items" ("sale_id");
      CREATE INDEX "IDX_sale_items_product_id" ON "sale_items" ("product_id");
    `);

    await queryRunner.query(`
      CREATE TABLE "invoice_sequences" (
        "id" character varying(32) NOT NULL,
        "current_value" integer NOT NULL DEFAULT 0,
        "prefix" character varying(10) NOT NULL DEFAULT 'INV-',
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_invoice_sequences" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      INSERT INTO "invoice_sequences" ("id", "current_value", "prefix")
      VALUES ('default', 0, 'INV-')
      ON CONFLICT ("id") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "invoice_sequences"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sale_items"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sales"`);
  }
}
