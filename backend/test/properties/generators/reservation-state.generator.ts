import * as fc from "fast-check";
import { ReservationStatusType } from "../../../src/domain/states/reservation-state.interface";
import { ActiveReservationState } from "../../../src/domain/states/active-reservation.state";
import { ConfirmedReservationState } from "../../../src/domain/states/confirmed-reservation.state";
import { ExpiredReservationState } from "../../../src/domain/states/expired-reservation.state";
import { CancelledReservationState } from "../../../src/domain/states/cancelled-reservation.state";

/**
 * Generator for reservation status types
 */
export const reservationStatusArbitrary =
  fc.constantFrom<ReservationStatusType>(
    "ACTIVE",
    "CONFIRMED",
    "EXPIRED",
    "CANCELLED",
  );

/**
 * Generator for state transition actions
 */
export const stateActionArbitrary = fc.constantFrom(
  "confirm",
  "cancel",
  "expire",
);

/**
 * Generator for valid state transitions from ACTIVE state
 */
export const validActiveTransitionArbitrary = fc.record({
  initialState: fc.constant("ACTIVE" as ReservationStatusType),
  action: stateActionArbitrary,
  expectedFinalState: fc.oneof(
    fc.constant("CONFIRMED" as ReservationStatusType),
    fc.constant("CANCELLED" as ReservationStatusType),
    fc.constant("EXPIRED" as ReservationStatusType),
  ),
});

/**
 * Generator for invalid state transitions from terminal states
 */
export const invalidTerminalTransitionArbitrary = fc.record({
  initialState: fc.constantFrom<ReservationStatusType>(
    "CONFIRMED",
    "EXPIRED",
    "CANCELLED",
  ),
  action: stateActionArbitrary,
});

/**
 * Generator for state machine test scenarios
 */
export const stateMachineScenarioArbitrary = fc.record({
  initialState: reservationStatusArbitrary,
  actions: fc.array(stateActionArbitrary, { minLength: 1, maxLength: 5 }),
});

/**
 * Helper to create state instance from status type
 */
export function createStateFromStatus(status: ReservationStatusType) {
  switch (status) {
    case "ACTIVE":
      return new ActiveReservationState();
    case "CONFIRMED":
      return new ConfirmedReservationState();
    case "EXPIRED":
      return new ExpiredReservationState();
    case "CANCELLED":
      return new CancelledReservationState();
    default:
      throw new Error(`Unknown status: ${status}`);
  }
}

/**
 * Helper to determine if a transition is valid
 */
export function isValidTransition(
  fromState: ReservationStatusType,
  action: string,
): boolean {
  // Only ACTIVE state allows any transitions
  if (fromState === "ACTIVE") {
    return ["confirm", "cancel", "expire"].includes(action);
  }

  // Terminal states (CONFIRMED, EXPIRED, CANCELLED) don't allow any transitions
  return false;
}

/**
 * Helper to get expected final state after valid transition
 */
export function getExpectedFinalState(
  fromState: ReservationStatusType,
  action: string,
): ReservationStatusType | null {
  if (fromState !== "ACTIVE") {
    return null; // Invalid transition
  }

  switch (action) {
    case "confirm":
      return "CONFIRMED";
    case "cancel":
      return "CANCELLED";
    case "expire":
      return "EXPIRED";
    default:
      return null;
  }
}
