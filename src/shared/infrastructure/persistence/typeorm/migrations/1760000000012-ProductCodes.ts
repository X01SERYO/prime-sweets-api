import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProductCodes1760000000012 implements MigrationInterface {
  name = 'ProductCodes1760000000012';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "products" ADD COLUMN "code" character varying(16)`);
    await queryRunner.query(`
      UPDATE "products" AS product
      SET "code" = numbered.code
      FROM (
        SELECT
          product_row.id,
          upper(coalesce(brand.code, 'GEN')) || lpad(product_row.sequence::text, 3, '0') AS code
        FROM (
          SELECT
            id,
            brand_id,
            row_number() OVER (PARTITION BY brand_id ORDER BY created_at, id) AS sequence
          FROM "products"
        ) AS product_row
        LEFT JOIN "brands" AS brand ON brand.id = product_row.brand_id
      ) AS numbered
      WHERE product.id = numbered.id
    `);
    await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "code" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "UQ_products_code" UNIQUE ("code")`);

    await queryRunner.query(`ALTER TABLE "sale_items" ADD COLUMN "product_code" character varying(16) NOT NULL DEFAULT ''`);
    await queryRunner.query(`
      UPDATE "sale_items" AS item
      SET "product_code" = product.code
      FROM "products" AS product
      WHERE product.id = item.product_id
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "sale_items" DROP COLUMN "product_code"`);
    await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "UQ_products_code"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "code"`);
  }
}
