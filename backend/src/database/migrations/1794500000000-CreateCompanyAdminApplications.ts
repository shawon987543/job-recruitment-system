import { MigrationInterface, QueryRunner } from 'typeorm';
export class CreateCompanyAdminApplications1794500000000
  implements MigrationInterface
{
  name = 'CreateCompanyAdminApplications1794500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "company_admin_applications" (
        "id" SERIAL NOT NULL,
        "companyId" integer NOT NULL,
        "adminName" character varying(150) NOT NULL,
        "adminEmail" character varying(255) NOT NULL,
        "contactPhone" character varying(30) NOT NULL,
        "status" character varying(20) NOT NULL DEFAULT 'PENDING',
        "rejectionReason" text,
        "reviewedBy" integer,
        "reviewedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_company_admin_applications"
          PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "company_admin_applications"
      ADD CONSTRAINT "FK_company_admin_applications_company"
      FOREIGN KEY ("companyId")
      REFERENCES "companies"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_company_admin_applications_companyId"
      ON "company_admin_applications" ("companyId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "IDX_company_admin_applications_companyId"
    `);

    await queryRunner.query(`
      ALTER TABLE "company_admin_applications"
      DROP CONSTRAINT "FK_company_admin_applications_company"
    `);

    await queryRunner.query(`
      DROP TABLE "company_admin_applications"
    `);
  }
}
