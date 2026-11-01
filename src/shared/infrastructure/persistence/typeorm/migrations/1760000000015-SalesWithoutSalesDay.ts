import { MigrationInterface, QueryRunner } from 'typeorm';

export class SalesWithoutSalesDay1760000000015 implements MigrationInterface {
  name = 'SalesWithoutSalesDay1760000000015';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "sales" DROP CONSTRAINT IF EXISTS "FK_sales_sales_day_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_sales_sales_day_id"`);
    await queryRunner.query(`ALTER TABLE "sales" DROP COLUMN "sales_day_id"`);
    await queryRunner.query(`ALTER TABLE "sales" ADD "seller_id" uuid NOT NULL`);
    await queryRunner.query(`ALTER TABLE "sales" ADD "capture_date" date NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "sales" ADD CONSTRAINT "FK_sales_seller_id" FOREIGN KEY ("seller_id") REFERENCES "users"("id")`
    );
    await queryRunner.query(`CREATE INDEX "IDX_sales_seller_id" ON "sales" ("seller_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_sales_seller_id"`);
    await queryRunner.query(`ALTER TABLE "sales" DROP CONSTRAINT IF EXISTS "FK_sales_seller_id"`);
    await queryRunner.query(`ALTER TABLE "sales" DROP COLUMN "capture_date"`);
    await queryRunner.query(`ALTER TABLE "sales" DROP COLUMN "seller_id"`);
    await queryRunner.query(`ALTER TABLE "sales" ADD "sales_day_id" uuid NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "sales" ADD CONSTRAINT "FK_sales_sales_day_id" FOREIGN KEY ("sales_day_id") REFERENCES "sales_days"("id")`
    );
    await queryRunner.query(`CREATE INDEX "IDX_sales_sales_day_id" ON "sales" ("sales_day_id")`);
  }
}
