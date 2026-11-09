import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPasswordResetFields1794300000000
  implements MigrationInterface
{
  name = 'AddPasswordResetFields1794300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "passwordResetTokenHash" character varying(255)
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "passwordResetExpiresAt" TIMESTAMP WITH TIME ZONE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "passwordResetExpiresAt"
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "passwordResetTokenHash"
    `);
  }
}