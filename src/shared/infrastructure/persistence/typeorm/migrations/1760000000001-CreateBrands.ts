import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBrands1760000000001 implements MigrationInterface {
  name = 'CreateBrands1760000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "brands" (
        "id" uuid NOT NULL,
        "code" character varying(32) NOT NULL,
        "name" character varying(255) NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_brands" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_brands_code" UNIQUE ("code")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "brands"`);
  }
}
