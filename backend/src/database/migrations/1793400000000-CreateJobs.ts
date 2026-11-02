import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateJobs1793400000000 implements MigrationInterface {
  name = 'CreateJobs1793400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "jobs" (
        "id" SERIAL NOT NULL,
        "title" character varying(200) NOT NULL,
        "description" text NOT NULL,
        "requirements" text NOT NULL,
        "location" character varying(200) NOT NULL,
        "jobType" character varying(30) NOT NULL DEFAULT 'FULL_TIME',
        "salaryMin" integer,
        "salaryMax" integer,
        "deadline" date,
        "status" character varying(20) NOT NULL DEFAULT 'DRAFT',
        "companyId" integer NOT NULL,
        "createdBy" integer NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_jobs_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_jobs_company_status"
      ON "jobs" ("companyId", "status")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "IDX_jobs_company_status"`,
    );
    await queryRunner.query(`DROP TABLE "jobs"`);
  }
}
