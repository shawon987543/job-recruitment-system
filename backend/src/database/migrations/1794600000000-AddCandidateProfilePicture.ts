import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCandidateProfilePicture1794600000000
  implements MigrationInterface
{
  name = 'AddCandidateProfilePicture1794600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "candidate_profiles"
      ADD COLUMN "profilePictureUrl" character varying(500)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "candidate_profiles"
      DROP COLUMN "profilePictureUrl"
    `);
  }
}
