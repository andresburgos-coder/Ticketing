import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQRTokenAndStatusToTickets1736281200000 implements MigrationInterface {
  name = 'AddQRTokenAndStatusToTickets1736281200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add qr_token column (UUID, unique, not null)
    await queryRunner.query(`
      ALTER TABLE tickets
      ADD COLUMN qr_token UUID NOT NULL DEFAULT gen_random_uuid()
    `);

    // Add unique constraint on qr_token
    await queryRunner.query(`
      ALTER TABLE tickets
      ADD CONSTRAINT UQ_tickets_qr_token UNIQUE (qr_token)
    `);

    // Add status column (ENUM, default 'PAID')
    await queryRunner.query(`
      CREATE TYPE ticket_status_enum AS ENUM ('PAID', 'USED')
    `);

    await queryRunner.query(`
      ALTER TABLE tickets
      ADD COLUMN status ticket_status_enum NOT NULL DEFAULT 'PAID'
    `);

    // Add used_at column (timestamp, nullable)
    await queryRunner.query(`
      ALTER TABLE tickets
      ADD COLUMN used_at TIMESTAMP
    `);

    // Create index on qr_token for fast lookups
    await queryRunner.query(`
      CREATE INDEX IDX_tickets_qr_token ON tickets (qr_token)
    `);

    // Create index on status for filtering
    await queryRunner.query(`
      CREATE INDEX IDX_tickets_status ON tickets (status)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`
      DROP INDEX IF EXISTS IDX_tickets_status
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS IDX_tickets_qr_token
    `);

    // Drop columns
    await queryRunner.query(`
      ALTER TABLE tickets
      DROP COLUMN used_at
    `);

    await queryRunner.query(`
      ALTER TABLE tickets
      DROP COLUMN status
    `);

    // Drop enum type
    await queryRunner.query(`
      DROP TYPE IF EXISTS ticket_status_enum
    `);

    // Drop constraint and column for qr_token
    await queryRunner.query(`
      ALTER TABLE tickets
      DROP CONSTRAINT IF EXISTS UQ_tickets_qr_token
    `);

    await queryRunner.query(`
      ALTER TABLE tickets
      DROP COLUMN qr_token
    `);
  }
}
