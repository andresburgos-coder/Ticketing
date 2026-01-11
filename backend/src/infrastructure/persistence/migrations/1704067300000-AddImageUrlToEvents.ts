import { MigrationInterface, QueryRunner } from "typeorm";

export class AddImageUrlToEvents1704067300000 implements MigrationInterface {
  name = "AddImageUrlToEvents1704067300000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add imageUrl column to events table
    await queryRunner.query(`
      ALTER TABLE events
      ADD COLUMN image_url TEXT
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove imageUrl column from events table
    await queryRunner.query(`
      ALTER TABLE events
      DROP COLUMN image_url
    `);
  }
}
