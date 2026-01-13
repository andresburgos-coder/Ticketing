import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { EventOrmEntity } from "./event.orm-entity";
import { EventCategory } from "../../../domain/enums/event-category.enum";

@Entity("event_details")
export class EventDetailsOrmEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => EventOrmEntity, (event) => event.details, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "eventid" })
  event!: EventOrmEntity;

  @Column("varchar", { length: 50, name: "eventid" })
  eventId!: string;

  @Column({
    type: "enum",
    enum: EventCategory,
    name: "category",
    default: EventCategory.CUALQUIER_CATEGORIA,
  })
  category!: EventCategory;

  @Column({ type: "int", nullable: true, name: "minage" })
  minAge?: number;

  @Column({ length: 100, nullable: true, name: "seating" })
  seating?: string;

  @Column({ type: "int", nullable: true, name: "capacity" })
  capacity?: number;

  @Column({ type: "boolean", default: false, name: "foodsale" })
  foodSale!: boolean;

  @Column({ type: "boolean", default: false, name: "liquorsale" })
  liquorSale!: boolean;

  @Column({ type: "boolean", default: false, name: "reducedmobilityaccess" })
  reducedMobilityAccess!: boolean;

  @Column({ type: "boolean", default: false, name: "pregnantaccess" })
  pregnantAccess!: boolean;
}
