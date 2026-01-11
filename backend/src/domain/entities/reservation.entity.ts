import { IReservationState, ReservationStatusType } from '../states/reservation-state.interface';
import { ActiveReservationState } from '../states/active-reservation.state';
import { TicketType } from '../value-objects/ticket-type.vo';
import { TicketQuantity } from '../value-objects/ticket-quantity.vo';
import { Email } from '../value-objects/email.vo';
import { Money } from '../value-objects/money.vo';
import { InvalidStateTransitionException } from '../exceptions/invalid-state-transition.exception';

/**
 * Reservation Entity - Represents a temporary ticket reservation
 * Uses State Pattern for managing reservation lifecycle
 * 
 * Requirements: 3.1, 3.3, 3.4, 4.3, 5.1
 * - 3.1: Reserva se crea con estado "Activa" y permite transiciones
 * - 3.3: Reserva expira automáticamente después de 15 minutos
 * - 3.4: Retorna ID único de reserva
 * - 4.3: Pago exitoso cambia estado a "Confirmada"
 * - 5.1: Pago fallido cancela reserva
 */
export class Reservation {
  private _state: IReservationState;

  constructor(
    public readonly id: string,
    public readonly eventId: string,
    public readonly ticketType: TicketType,
    public readonly quantity: TicketQuantity,
    public readonly buyerEmail: Email,
    public readonly totalAmount: Money,
    public readonly expiresAt: Date,
    public readonly createdAt: Date = new Date()
  ) {
    // Initialize with Active state as per requirement 3.1
    this._state = new ActiveReservationState();
  }

  /**
   * Gets the current status of the reservation
   */
  get status(): ReservationStatusType {
    return this._state.name;
  }

  /**
   * Checks if the reservation is currently active
   */
  get isActive(): boolean {
    return this._state.name === 'ACTIVE';
  }

  /**
   * Checks if the reservation has expired based on current time
   * Requirements: 3.3 - Reserva expira automáticamente
   */
  get isExpired(): boolean {
    return new Date() > this.expiresAt && this._state.name === 'ACTIVE';
  }

  /**
   * Sets the internal state (used by State Pattern)
   * This method is called by state objects to transition between states
   */
  setState(state: IReservationState): void {
    this._state = state;
  }

  /**
   * Confirms the reservation (typically after successful payment)
   * Requirements: 4.3 - Pago exitoso cambia estado a "Confirmada"
   * @throws InvalidStateTransitionException if confirmation is not allowed
   */
  confirm(): void {
    if (!this._state.canConfirm()) {
      throw new InvalidStateTransitionException(this._state.name, 'confirm');
    }
    this._state.confirm(this);
  }

  /**
   * Cancels the reservation (typically after payment failure)
   * Requirements: 5.1 - Pago fallido cancela reserva
   * @throws InvalidStateTransitionException if cancellation is not allowed
   */
  cancel(): void {
    if (!this._state.canCancel()) {
      throw new InvalidStateTransitionException(this._state.name, 'cancel');
    }
    this._state.cancel(this);
  }

  /**
   * Expires the reservation (typically by scheduled job)
   * Requirements: 3.3 - Reserva expira automáticamente
   * @throws InvalidStateTransitionException if expiration is not allowed
   */
  expire(): void {
    if (!this._state.canExpire()) {
      throw new InvalidStateTransitionException(this._state.name, 'expire');
    }
    this._state.expire(this);
  }
}