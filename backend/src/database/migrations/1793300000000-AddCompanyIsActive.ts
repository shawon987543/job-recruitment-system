import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCompanyIsActive1793300000000
  implements MigrationInterface
{
  name = 'AddCompanyIsActive1793300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "companies"
      ADD COLUMN "isActive" boolean NOT NULL DEFAULT true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "companies"
      DROP COLUMN "isActive"
    `);
  }
}