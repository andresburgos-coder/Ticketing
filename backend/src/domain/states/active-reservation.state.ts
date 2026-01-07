import { IReservationState, Reservation, ReservationStatusType } from './reservation-state.interface';
import { ConfirmedReservationState } from './confirmed-reservation.state';
import { CancelledReservationState } from './cancelled-reservation.state';
import { ExpiredReservationState } from './expired-reservation.state';

/**
 * Active Reservation State - Initial state when reservation is created
 * Allows all transitions: confirm, cancel, expire
 * 
 * Requirements: 3.1, 3.3, 5.1
 * - 3.1: Reserva se crea con estado "Activa" 
 * - 3.3: Permite expiración automática
 * - 5.1: Permite cancelación por pago fallido
 */
export class ActiveReservationState implements IReservationState {
  readonly name: ReservationStatusType = 'ACTIVE';

  canConfirm(): boolean {
    return true;
  }

  canCancel(): boolean {
    return true;
  }

  canExpire(): boolean {
    return true;
  }

  confirm(reservation: Reservation): void {
    reservation.setState(new ConfirmedReservationState());
  }

  cancel(reservation: Reservation): void {
    reservation.setState(new CancelledReservationState());
  }

  expire(reservation: Reservation): void {
    reservation.setState(new ExpiredReservationState());
  }
}