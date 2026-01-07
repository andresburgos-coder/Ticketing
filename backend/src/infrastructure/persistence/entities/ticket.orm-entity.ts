import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { TicketType } from '../../../domain/value-objects/ticket-type.vo';

/**
 * Ticket ORM Entity
 * Represents the database schema for tickets.
 * Separated from domain Ticket entity to maintain clean architecture.
 * 
 * Requirements: 4.4, 6.1, 6.2
 * - 4.4: Tickets are generated with unique code, event, type and buyer data
 * - 6.1: Return all confirmed tickets for a buyer
 * - 6.2: Each ticket includes: code, event name, ticket type, purchase date
 */
@Entity('tickets')
export class TicketOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ unique: true, length: 50 })
  code!: string;

  @Column('uuid')
  eventId!: string;

  @Column({ type: 'enum', enum: TicketType })
  type!: TicketType;

  @Column({ length: 255 })
  buyerEmail!: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price!: number;

  @Column({ length: 3 })
  currency!: string;

  @CreateDateColumn()
  purchaseDate!: Date;
}
