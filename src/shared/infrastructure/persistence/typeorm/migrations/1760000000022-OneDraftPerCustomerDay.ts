import { MigrationInterface, QueryRunner } from 'typeorm';

export class OneDraftPerCustomerDay1760000000022 implements MigrationInterface {
  name = 'OneDraftPerCustomerDay1760000000022';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      WITH ranked AS (
        SELECT
          sale.id,
          sale.customer_id,
          sale.delivery_date,
          ROW_NUMBER() OVER (
            PARTITION BY sale.customer_id, sale.delivery_date
            ORDER BY (
              SELECT COUNT(*) FROM "sale_items" AS item WHERE item.sale_id = sale.id
            ) DESC, sale.updated_at DESC
          ) AS rank
        FROM "sales" AS sale
        WHERE sale.status = 'DRAFT'
      )
      UPDATE "sale_items" AS item
      SET "sale_id" = keeper.id
      FROM ranked AS extra
      JOIN ranked AS keeper
        ON keeper.customer_id = extra.customer_id
       AND keeper.delivery_date = extra.delivery_date
       AND keeper.rank = 1
      WHERE extra.rank > 1
        AND item.sale_id = extra.id
    `);
    await queryRunner.query(`
      WITH ranked AS (
        SELECT
          sale.id,
          ROW_NUMBER() OVER (
            PARTITION BY sale.customer_id, sale.delivery_date
            ORDER BY (
              SELECT COUNT(*) FROM "sale_items" AS item WHERE item.sale_id = sale.id
            ) DESC, sale.updated_at DESC
          ) AS rank
        FROM "sales" AS sale
        WHERE sale.status = 'DRAFT'
      )
      DELETE FROM "sales" AS sale
      USING ranked
      WHERE ranked.rank > 1
        AND sale.id = ranked.id
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_sales_one_draft_per_customer_day"
      ON "sales" ("customer_id", "delivery_date")
      WHERE "status" = 'DRAFT'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_sales_one_draft_per_customer_day"`);
  }
}
