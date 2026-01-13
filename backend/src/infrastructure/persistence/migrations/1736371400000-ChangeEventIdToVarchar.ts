import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeEventIdToVarchar1736371400000 implements MigrationInterface {
  name = "ChangeEventIdToVarchar1736371400000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Change event_id column type from UUID to VARCHAR(50) in tickets table
    await queryRunner.query(`
      ALTER TABLE tickets 
      ALTER COLUMN event_id TYPE VARCHAR(50)
    `);

    // Also update the same column in reservations table for consistency
    await queryRunner.query(`
      ALTER TABLE reservations 
      ALTER COLUMN event_id TYPE VARCHAR(50)
    `);

    // Update ticket_release_logs table as well
    await queryRunner.query(`
      ALTER TABLE ticket_release_logs 
      ALTER COLUMN event_id TYPE VARCHAR(50)
    `);

    // Update ticket_configurations table
    await queryRunner.query(`
      ALTER TABLE ticket_configurations 
      ALTER COLUMN event_id TYPE VARCHAR(50)
    `);

    // Update event_details table
    await queryRunner.query(`
      ALTER TABLE event_details 
      ALTER COLUMN "eventId" TYPE VARCHAR(50)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert back to UUID type
    await queryRunner.query(`
      ALTER TABLE event_details 
      ALTER COLUMN "eventId" TYPE UUID USING "eventId"::UUID
    `);

    await queryRunner.query(`
      ALTER TABLE ticket_configurations 
      ALTER COLUMN event_id TYPE UUID USING event_id::UUID
    `);

    await queryRunner.query(`
      ALTER TABLE ticket_release_logs 
      ALTER COLUMN event_id TYPE UUID USING event_id::UUID
    `);

    await queryRunner.query(`
      ALTER TABLE reservations 
      ALTER COLUMN event_id TYPE UUID USING event_id::UUID
    `);

    await queryRunner.query(`
      ALTER TABLE tickets 
      ALTER COLUMN event_id TYPE UUID USING event_id::UUID
    `);
  }
}
