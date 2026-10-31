import { MigrationInterface, QueryRunner } from 'typeorm';

export class SaleDeliveryDate1760000000014 implements MigrationInterface {
  name = 'SaleDeliveryDate1760000000014';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "sales" ADD "delivery_date" date`);
    await queryRunner.query(`
      UPDATE "sales" AS sale
      SET "delivery_date" = day."date"::date
      FROM "sales_days" AS day
      WHERE day."id" = sale."sales_day_id"
    `);
    await queryRunner.query(`ALTER TABLE "sales" ALTER COLUMN "delivery_date" SET NOT NULL`);
    await queryRunner.query(`CREATE INDEX "IDX_sales_delivery_date_status" ON "sales" ("delivery_date", "status")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_sales_delivery_date_status"`);
    await queryRunner.query(`ALTER TABLE "sales" DROP COLUMN "delivery_date"`);
  }
}
