import { ReservationStatusType } from '../states/reservation-state.interface';

/**
 * Exception thrown when an invalid state transition is attempted.
 * 
 * Requirements: 3.1, 3.3, 5.1
 * - Prevents invalid state transitions in reservation lifecycle
 */
export class InvalidStateTransitionException extends Error {
  constructor(
    public readonly currentState: ReservationStatusType,
    public readonly attemptedAction: string
  ) {
    super(`Cannot ${attemptedAction} reservation in ${currentState} state`);
    this.name = 'InvalidStateTransitionException';
  }
}