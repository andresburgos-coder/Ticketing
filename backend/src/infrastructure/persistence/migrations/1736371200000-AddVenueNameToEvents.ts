import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVenueNameToEvents1736371200000 implements MigrationInterface {
  name = "AddVenueNameToEvents1736371200000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "events" ADD "venueName" character varying(255) NOT NULL DEFAULT ''`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "venueName"`);
  }
}
