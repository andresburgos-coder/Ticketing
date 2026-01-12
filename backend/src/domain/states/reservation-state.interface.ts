/**
 * Interface for Reservation State Pattern
 * Defines the contract for all reservation states
 *
 * Requirements: 3.1, 3.3, 5.1
 * - 3.1: Reserva se crea con estado "Activa" y permite transiciones
 * - 3.3: Reserva expira y cambia estado automáticamente
 * - 5.1: Pago fallido cancela reserva
 */

// Type literal for valid reservation status values
export type ReservationStatusType =
  | "ACTIVE"
  | "CONFIRMED"
  | "EXPIRED"
  | "CANCELLED";

// Forward declaration for Reservation entity
export interface Reservation {
  setState(state: IReservationState): void;
}

/**
 * State interface following ISP (Interface Segregation Principle)
 * Each state knows what transitions it allows
 */
export interface IReservationState {
  readonly name: ReservationStatusType;

  // Query methods to check allowed transitions
  canConfirm(): boolean;
  canCancel(): boolean;
  canExpire(): boolean;

  // Action methods that perform state transitions
  confirm(reservation: Reservation): void;
  cancel(reservation: Reservation): void;
  expire(reservation: Reservation): void;
}
