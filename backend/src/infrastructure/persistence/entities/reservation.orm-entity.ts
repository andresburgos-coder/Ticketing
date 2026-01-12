import { Entity, PrimaryColumn, Column, CreateDateColumn } from "typeorm";
import { TicketType } from "../../../domain/value-objects/ticket-type.vo";
import { ReservationStatusType } from "../../../domain/states/reservation-state.interface";

/**
 * Reservation ORM Entity
 * Represents the database schema for reservations.
 * Separated from domain Reservation entity to maintain clean architecture.
 *
 * Requirements: 3.1, 3.3, 3.4
 * - 3.1: Reserva se crea con estado "Activa"
 * - 3.3: Reserva expira automáticamente después de 15 minutos
 * - 3.4: Retorna ID único de reserva
 */
@Entity("reservations")
export class ReservationOrmEntity {
  @PrimaryColumn("uuid")
  id!: string;

  @Column("varchar", { length: 50 })
  eventId!: string;

  @Column({ type: "enum", enum: TicketType })
  ticketType!: TicketType;

  @Column()
  quantity!: number;

  @Column({ length: 255 })
  buyerEmail!: string;

  @Column("decimal", { precision: 10, scale: 2 })
  totalAmount!: number;

  @Column({ length: 3 })
  currency!: string;

  @Column({ type: "varchar", length: 20 })
  status!: ReservationStatusType;

  @Column("timestamp")
  expiresAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;
}
