import { MigrationInterface, QueryRunner } from 'typeorm';

export class SupplierProductPreviousQuantity1760000000019 implements MigrationInterface {
  name = 'SupplierProductPreviousQuantity1760000000019';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "supplier_products" ADD "previous_quantity" integer`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "supplier_products" DROP COLUMN "previous_quantity"`);
  }
}
