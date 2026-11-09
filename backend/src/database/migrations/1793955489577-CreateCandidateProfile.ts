import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCandidateProfile1793955489577
  implements MigrationInterface
{
  name = 'CreateCandidateProfile1793955489577';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "candidate_profiles" (
        "id" SERIAL NOT NULL,
        "phone" character varying(30),
        "address" text,
        "dateOfBirth" date,
        "bio" text,
        "skills" text array NOT NULL DEFAULT '{}',
        "resumeUrl" character varying(500),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "userId" integer,
        CONSTRAINT "REL_df5454fe06a1630d3ba903a95d"
          UNIQUE ("userId"),
        CONSTRAINT "PK_8e8cf5b54118601673585218cc4"
          PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "educations" (
        "id" SERIAL NOT NULL,
        "institution" character varying(150) NOT NULL,
        "degree" character varying(150) NOT NULL,
        "fieldOfStudy" character varying(150),
        "startDate" date,
        "endDate" date,
        "isCurrentlyStudying" boolean NOT NULL DEFAULT false,
        "description" text,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "candidateProfileId" integer,
        CONSTRAINT "PK_09d2f29e7f6f31f5c01d79d2dbf"
          PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "experiences" (
        "id" SERIAL NOT NULL,
        "companyName" character varying(150) NOT NULL,
        "jobTitle" character varying(150) NOT NULL,
        "employmentType" character varying(150),
        "location" character varying(150),
        "startDate" date NOT NULL,
        "endDate" date,
        "isCurrentlyWorking" boolean NOT NULL DEFAULT false,
        "description" text,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "candidateProfileId" integer,
        CONSTRAINT "PK_884f0913a63882712ea578e7c85"
          PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "candidate_profiles"
      ADD CONSTRAINT "FK_df5454fe06a1630d3ba903a95d8"
      FOREIGN KEY ("userId")
      REFERENCES "users"("id")
      ON DELETE NO ACTION
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "educations"
      ADD CONSTRAINT "FK_0467bf736ba045973fd9094ee2b"
      FOREIGN KEY ("candidateProfileId")
      REFERENCES "candidate_profiles"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "experiences"
      ADD CONSTRAINT "FK_3863e5d869f61747d80a1b8a396"
      FOREIGN KEY ("candidateProfileId")
      REFERENCES "candidate_profiles"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "experiences"
      DROP CONSTRAINT "FK_3863e5d869f61747d80a1b8a396"
    `);

    await queryRunner.query(`
      ALTER TABLE "educations"
      DROP CONSTRAINT "FK_0467bf736ba045973fd9094ee2b"
    `);

    await queryRunner.query(`
      ALTER TABLE "candidate_profiles"
      DROP CONSTRAINT "FK_df5454fe06a1630d3ba903a95d8"
    `);

    await queryRunner.query(`DROP TABLE "experiences"`);
    await queryRunner.query(`DROP TABLE "educations"`);
    await queryRunner.query(`DROP TABLE "candidate_profiles"`);
  }
}