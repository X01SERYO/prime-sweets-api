import { MigrationInterface, QueryRunner } from 'typeorm';

export class SupplierProductItems1760000000020 implements MigrationInterface {
  name = 'SupplierProductItems1760000000020';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "supplier_products" ADD "items" jsonb NOT NULL DEFAULT '[]'`);
    await queryRunner.query(`
      UPDATE "supplier_products" AS product
      SET "items" = COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'itemName', line->>'itemName',
          'lastQuantity', (line->>'quantity')::int
        ))
        FROM "purchase_orders" AS purchase
        CROSS JOIN LATERAL jsonb_array_elements(purchase.lines) AS line
        WHERE purchase.supplier_id = product.supplier_id
          AND purchase.lines IS NOT NULL
          AND line->>'productId' = product.product_id::text
          AND lower(line->>'itemName') IS DISTINCT FROM lower(COALESCE(line->>'catalogName', ''))
          AND purchase.id = (
            SELECT latest.id
            FROM "purchase_orders" AS latest
            WHERE latest.supplier_id = product.supplier_id
              AND latest.lines IS NOT NULL
            ORDER BY latest.created_at DESC
            LIMIT 1
          )
      ), CASE
        WHEN product.last_item_name IS NOT NULL THEN jsonb_build_array(jsonb_build_object(
          'itemName', product.last_item_name,
          'lastQuantity', product.last_quantity
        ))
        ELSE '[]'::jsonb
      END)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "supplier_products" DROP COLUMN "items"`);
  }
}
