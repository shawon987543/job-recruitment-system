import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCompanies1793184136180 implements MigrationInterface {
    name = 'CreateCompanies1793184136180'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."companies_status_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED')`);
        await queryRunner.query(`CREATE TABLE "companies" ("id" SERIAL NOT NULL, "name" character varying(200) NOT NULL, "email" character varying(255) NOT NULL, "contactName" character varying(150) NOT NULL, "contactPhone" character varying(30) NOT NULL, "website" character varying(255), "address" text, "description" text, "status" "public"."companies_status_enum" NOT NULL DEFAULT 'PENDING', "rejectionReason" text, "reviewedBy" integer, "reviewedAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_d0af6f5866201d5cb424767744a" UNIQUE ("email"), CONSTRAINT "PK_d4bc3e82a314fa9e29f652c2c22" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "companies"`);
        await queryRunner.query(`DROP TYPE "public"."companies_status_enum"`);
    }

}
