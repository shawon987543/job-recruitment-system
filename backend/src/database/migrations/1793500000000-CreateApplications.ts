import { MigrationInterface, QueryRunner } from 'typeorm';
export class CreateApplications1793500000000
  implements MigrationInterface
{
  name = 'CreateApplications1793500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "applications" (
        "id" SERIAL NOT NULL,
        "jobId" integer NOT NULL,
        "candidateId" integer NOT NULL,
        "coverLetter" text,
        "cvUrl" varchar(500),
        "status" varchar(20) NOT NULL DEFAULT 'PENDING',
        "adminNotes" text,
        "appliedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "withdrawnAt" TIMESTAMPTZ,
        CONSTRAINT "PK_applications_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_application_job_candidate"
          UNIQUE ("jobId", "candidateId"),
        CONSTRAINT "FK_applications_job"
          FOREIGN KEY ("jobId") REFERENCES "jobs"("id")
          ON DELETE CASCADE,
        CONSTRAINT "FK_applications_candidate"
          FOREIGN KEY ("candidateId") REFERENCES "users"("id")
          ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_applications_job_status"
      ON "applications" ("jobId", "status")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_applications_job_status"
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS "applications"
    `);
  }
}
