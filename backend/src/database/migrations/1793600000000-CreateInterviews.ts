import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInterviews1793600000000
  implements MigrationInterface
{
  name = 'CreateInterviews1793600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "interviews" (
        "id" SERIAL NOT NULL,
        "applicationId" integer NOT NULL,
        "companyId" integer NOT NULL,
        "scheduledAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "type" varchar(20) NOT NULL DEFAULT 'ONLINE',
        "status" varchar(20) NOT NULL DEFAULT 'SCHEDULED',
        "meetingLink" varchar(1000),
        "location" varchar(500),
        "notes" text,
        "createdBy" integer NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

        CONSTRAINT "PK_interviews_id" PRIMARY KEY ("id"),

        CONSTRAINT "FK_interviews_application"
          FOREIGN KEY ("applicationId")
          REFERENCES "applications"("id")
          ON DELETE CASCADE,

        CONSTRAINT "FK_interviews_company"
          FOREIGN KEY ("companyId")
          REFERENCES "companies"("id")
          ON DELETE CASCADE,

        CONSTRAINT "FK_interviews_created_by"
          FOREIGN KEY ("createdBy")
          REFERENCES "users"("id")
          ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_interviews_company_scheduled"
      ON "interviews" ("companyId", "scheduledAt")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_interviews_application"
      ON "interviews" ("applicationId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "IDX_interviews_application"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_interviews_company_scheduled"
    `);

    await queryRunner.query(`
      DROP TABLE "interviews"
    `);
  }
}