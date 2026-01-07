import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { EventOrmEntity } from './event.orm-entity';
import { TicketType } from '../../../domain/value-objects/ticket-type.vo';

/**
 * TicketConfiguration ORM Entity
 * Represents the database schema for ticket configurations.
 * Part of the Event aggregate in the database layer.
 * 
 * Requirements: 1.2, 2.2
 */
@Entity('ticket_configurations')
export class TicketConfigurationOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => EventOrmEntity, (event) => event.ticketConfigurations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'event_id' })
  event!: EventOrmEntity;

  @Column({ type: 'enum', enum: TicketType })
  type!: TicketType;

  @Column('decimal', { precision: 10, scale: 2 })
  price!: number;

  @Column()
  totalQuantity!: number;

  @Column()
  availableQuantity!: number;
}
