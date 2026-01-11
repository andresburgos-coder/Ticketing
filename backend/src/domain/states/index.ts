/**
 * State Pattern exports for Reservation State Machine
 * 
 * Requirements: 3.1, 3.3, 5.1
 * - 3.1: Reserva se crea con estado "Activa" y permite transiciones
 * - 3.3: Reserva expira y cambia estado automáticamente
 * - 5.1: Pago fallido cancela reserva
 */

export { IReservationState, Reservation, ReservationStatusType } from './reservation-state.interface';
export { ActiveReservationState } from './active-reservation.state';
export { ConfirmedReservationState } from './confirmed-reservation.state';
export { ExpiredReservationState } from './expired-reservation.state';
export { CancelledReservationState } from './cancelled-reservation.state';