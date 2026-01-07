import {
  Entity,
  PrimaryColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TicketConfigurationOrmEntity } from './ticket-configuration.orm-entity';

/**
 * Event ORM Entity
 * Represents the database schema for events.
 * Separated from domain Event entity to maintain clean architecture.
 * 
 * Requirements: 1.1, 1.3, 8.3
 */
@Entity('events')
export class EventOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ length: 255 })
  name!: string;

  @Column('timestamp')
  date!: Date;

  @Column({ length: 500 })
  location!: string;

  @OneToMany(
    () => TicketConfigurationOrmEntity,
    (config) => config.event,
    {
      cascade: true,
      eager: true,
      onDelete: 'CASCADE',
    }
  )
  ticketConfigurations!: TicketConfigurationOrmEntity[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
