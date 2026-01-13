import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateInitialSchema1704067200000 implements MigrationInterface {
  name = "CreateInitialSchema1704067200000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create events table
    await queryRunner.query(`
      CREATE TABLE events (
        id UUID PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        date TIMESTAMP NOT NULL,
        location VARCHAR(500) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create ticket_configurations table
    await queryRunner.query(`
      CREATE TABLE ticket_configurations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        type VARCHAR(20) NOT NULL CHECK (type IN ('VIP', 'GENERAL', 'EARLY_BIRD')),
        price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
        total_quantity INTEGER NOT NULL CHECK (total_quantity > 0),
        available_quantity INTEGER NOT NULL CHECK (available_quantity >= 0),
        UNIQUE(event_id, type),
        CHECK (available_quantity <= total_quantity)
      )
    `);

    // Create reservations table
    await queryRunner.query(`
      CREATE TABLE reservations (
        id UUID PRIMARY KEY,
        event_id UUID NOT NULL REFERENCES events(id),
        ticket_type VARCHAR(20) NOT NULL CHECK (ticket_type IN ('VIP', 'GENERAL', 'EARLY_BIRD')),
        quantity INTEGER NOT NULL CHECK (quantity > 0 AND quantity <= 10),
        buyer_email VARCHAR(255) NOT NULL,
        total_amount DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(3) NOT NULL DEFAULT 'USD',
        status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' 
          CHECK (status IN ('ACTIVE', 'CONFIRMED', 'EXPIRED', 'CANCELLED')),
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create tickets table
    await queryRunner.query(`
      CREATE TABLE tickets (
        id UUID PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        event_id UUID NOT NULL REFERENCES events(id),
        type VARCHAR(20) NOT NULL CHECK (type IN ('VIP', 'GENERAL', 'EARLY_BIRD')),
        buyer_email VARCHAR(255) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(3) NOT NULL DEFAULT 'USD',
        purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create payments table
    await queryRunner.query(`
      CREATE TABLE payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reservation_id UUID NOT NULL REFERENCES reservations(id),
        amount DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(3) NOT NULL DEFAULT 'USD',
        status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
          CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED')),
        transaction_id VARCHAR(255),
        error_message TEXT,
        processed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create ticket_release_logs table
    await queryRunner.query(`
      CREATE TABLE ticket_release_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id UUID NOT NULL REFERENCES events(id),
        ticket_type VARCHAR(20) NOT NULL,
        quantity INTEGER NOT NULL,
        reason VARCHAR(255) NOT NULL,
        released_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for performance
    await queryRunner.query(`
      CREATE INDEX idx_reservations_status ON reservations(status)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_reservations_expires_at ON reservations(expires_at) WHERE status = 'ACTIVE'
    `);

    await queryRunner.query(`
      CREATE INDEX idx_tickets_buyer_email ON tickets(buyer_email)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_tickets_event_id ON tickets(event_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS idx_tickets_event_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_tickets_buyer_email`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_reservations_expires_at`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_reservations_status`);

    // Drop tables in reverse order (respecting foreign key constraints)
    await queryRunner.query(`DROP TABLE IF EXISTS ticket_release_logs`);
    await queryRunner.query(`DROP TABLE IF EXISTS payments`);
    await queryRunner.query(`DROP TABLE IF EXISTS tickets`);
    await queryRunner.query(`DROP TABLE IF EXISTS reservations`);
    await queryRunner.query(`DROP TABLE IF EXISTS ticket_configurations`);
    await queryRunner.query(`DROP TABLE IF EXISTS events`);
  }
}
