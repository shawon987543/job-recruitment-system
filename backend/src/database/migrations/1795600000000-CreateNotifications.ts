import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotifications1795600000000
  implements MigrationInterface
{
  name = 'CreateNotifications1795600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" SERIAL NOT NULL,
        "user_id" integer NOT NULL,
        "title" character varying(255) NOT NULL,
        "message" text NOT NULL,
        "type" character varying(50) NOT NULL,
        "reference_id" integer,
        "reference_type" character varying(50),
        "is_read" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notifications_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_notifications_user"
          FOREIGN KEY ("user_id")
          REFERENCES "users"("id")
          ON DELETE CASCADE
          ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_notifications_user_read_created"
      ON "notifications" ("user_id", "is_read", "created_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "IDX_notifications_user_read_created"
    `);

    await queryRunner.query(`
      ALTER TABLE "notifications"
      DROP CONSTRAINT "FK_notifications_user"
    `);

    await queryRunner.query(`
      DROP TABLE "notifications"
    `);
  }
}
