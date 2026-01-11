import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';

@Entity('event_details')
export class EventDetailsOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne('EventOrmEntity', 'details', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'eventid' })
  event!: any;

  @Column('uuid', { name: 'eventid' })
  eventId!: string;

  @Column({ length: 100, name: 'category' })
  category!: string;

  @Column({ type: 'int', nullable: true, name: 'minage' })
  minAge?: number;

  @Column({ length: 100, nullable: true, name: 'seating' })
  seating?: string;

  @Column({ type: 'int', nullable: true, name: 'capacity' })
  capacity?: number;

  @Column({ type: 'boolean', default: false, name: 'foodsale' })
  foodSale!: boolean;

  @Column({ type: 'boolean', default: false, name: 'liquorsale' })
  liquorSale!: boolean;

  @Column({ type: 'boolean', default: false, name: 'reducedmobilityaccess' })
  reducedMobilityAccess!: boolean;

  @Column({ type: 'boolean', default: false, name: 'pregnantaccess' })
  pregnantAccess!: boolean;
}
