import { MigrationInterface, QueryRunner } from 'typeorm';

export class SaleItemCatalogName1760000000013 implements MigrationInterface {
  name = 'SaleItemCatalogName1760000000013';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "sale_items" ADD COLUMN "catalog_name" character varying(255) NOT NULL DEFAULT ''`);
    await queryRunner.query(`
      UPDATE "sale_items" AS item
      SET "catalog_name" = COALESCE(NULLIF(product.name, ''), item.item_name)
      FROM "products" AS product
      WHERE product.id = item.product_id
    `);
    await queryRunner.query(`UPDATE "sale_items" SET "catalog_name" = "item_name" WHERE "catalog_name" = ''`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "sale_items" DROP COLUMN "catalog_name"`);
  }
}
