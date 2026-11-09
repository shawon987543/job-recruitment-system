import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCompanyAdminApplicantFields1794400000000
  implements MigrationInterface
{
  name = 'AddCompanyAdminApplicantFields1794400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "companies"
      ADD COLUMN "adminName" character varying(150)
    `);

    await queryRunner.query(`
      ALTER TABLE "companies"
      ADD COLUMN "adminEmail" character varying(255)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "companies"
      DROP COLUMN "adminEmail"
    `);

    await queryRunner.query(`
      ALTER TABLE "companies"
      DROP COLUMN "adminName"
    `);
  }
}