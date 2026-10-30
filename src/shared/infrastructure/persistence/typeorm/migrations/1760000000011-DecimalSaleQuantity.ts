import { MigrationInterface, QueryRunner } from 'typeorm';

export class DecimalSaleQuantity1760000000011 implements MigrationInterface {
  name = 'DecimalSaleQuantity1760000000011';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "sale_items" ALTER COLUMN "quantity" TYPE numeric(12,3) USING "quantity"::numeric(12,3)`);
    await queryRunner.query(
      `ALTER TABLE "sales" ALTER COLUMN "total_quantity" TYPE numeric(14,3) USING "total_quantity"::numeric(14,3)`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "sale_items" ALTER COLUMN "quantity" TYPE integer USING round("quantity")::integer`);
    await queryRunner.query(`ALTER TABLE "sales" ALTER COLUMN "total_quantity" TYPE integer USING round("total_quantity")::integer`);
  }
}
