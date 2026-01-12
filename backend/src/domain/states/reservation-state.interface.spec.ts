import { ActiveReservationState } from "./active-reservation.state";
import { ConfirmedReservationState } from "./confirmed-reservation.state";
import { ExpiredReservationState } from "./expired-reservation.state";
import { CancelledReservationState } from "./cancelled-reservation.state";
import { IReservationState } from "./reservation-state.interface";

/**
 * Unit tests for Reservation State Pattern
 * Following TDD Red-Green-Refactor cycle
 *
 * Requirements: 3.1, 3.3, 5.1
 * - 3.1: Reserva se crea con estado "Activa" y permite transiciones
 * - 3.3: Reserva expira y cambia estado automáticamente
 * - 5.1: Pago fallido cancela reserva
 */
describe("Reservation State Pattern", () => {
  let mockReservation: any;

  beforeEach(() => {
    // Mock reservation object for state transitions
    mockReservation = {
      setState: jest.fn(),
    };
  });

  describe("ActiveReservationState", () => {
    let activeState: IReservationState;

    beforeEach(() => {
      activeState = new ActiveReservationState();
    });

    it("should have name ACTIVE", () => {
      expect(activeState.name).toBe("ACTIVE");
    });

    it("should allow confirm transition", () => {
      expect(activeState.canConfirm()).toBe(true);
    });

    it("should allow cancel transition", () => {
      expect(activeState.canCancel()).toBe(true);
    });

    it("should allow expire transition", () => {
      expect(activeState.canExpire()).toBe(true);
    });

    it("should transition to ConfirmedReservationState when confirmed", () => {
      activeState.confirm(mockReservation);

      expect(mockReservation.setState).toHaveBeenCalledWith(
        expect.any(ConfirmedReservationState),
      );
    });

    it("should transition to CancelledReservationState when cancelled", () => {
      activeState.cancel(mockReservation);

      expect(mockReservation.setState).toHaveBeenCalledWith(
        expect.any(CancelledReservationState),
      );
    });

    it("should transition to ExpiredReservationState when expired", () => {
      activeState.expire(mockReservation);

      expect(mockReservation.setState).toHaveBeenCalledWith(
        expect.any(ExpiredReservationState),
      );
    });
  });

  describe("ConfirmedReservationState", () => {
    let confirmedState: IReservationState;

    beforeEach(() => {
      confirmedState = new ConfirmedReservationState();
    });

    it("should have name CONFIRMED", () => {
      expect(confirmedState.name).toBe("CONFIRMED");
    });

    it("should not allow confirm transition", () => {
      expect(confirmedState.canConfirm()).toBe(false);
    });

    it("should not allow cancel transition", () => {
      expect(confirmedState.canCancel()).toBe(false);
    });

    it("should not allow expire transition", () => {
      expect(confirmedState.canExpire()).toBe(false);
    });

    it("should throw error when trying to confirm", () => {
      expect(() => confirmedState.confirm(mockReservation)).toThrow();
    });

    it("should throw error when trying to cancel", () => {
      expect(() => confirmedState.cancel(mockReservation)).toThrow();
    });

    it("should throw error when trying to expire", () => {
      expect(() => confirmedState.expire(mockReservation)).toThrow();
    });
  });

  describe("ExpiredReservationState", () => {
    let expiredState: IReservationState;

    beforeEach(() => {
      expiredState = new ExpiredReservationState();
    });

    it("should have name EXPIRED", () => {
      expect(expiredState.name).toBe("EXPIRED");
    });

    it("should not allow confirm transition", () => {
      expect(expiredState.canConfirm()).toBe(false);
    });

    it("should not allow cancel transition", () => {
      expect(expiredState.canCancel()).toBe(false);
    });

    it("should not allow expire transition", () => {
      expect(expiredState.canExpire()).toBe(false);
    });

    it("should throw error when trying to confirm", () => {
      expect(() => expiredState.confirm(mockReservation)).toThrow();
    });

    it("should throw error when trying to cancel", () => {
      expect(() => expiredState.cancel(mockReservation)).toThrow();
    });

    it("should throw error when trying to expire", () => {
      expect(() => expiredState.expire(mockReservation)).toThrow();
    });
  });

  describe("CancelledReservationState", () => {
    let cancelledState: IReservationState;

    beforeEach(() => {
      cancelledState = new CancelledReservationState();
    });

    it("should have name CANCELLED", () => {
      expect(cancelledState.name).toBe("CANCELLED");
    });

    it("should not allow confirm transition", () => {
      expect(cancelledState.canConfirm()).toBe(false);
    });

    it("should not allow cancel transition", () => {
      expect(cancelledState.canCancel()).toBe(false);
    });

    it("should not allow expire transition", () => {
      expect(cancelledState.canExpire()).toBe(false);
    });

    it("should throw error when trying to confirm", () => {
      expect(() => cancelledState.confirm(mockReservation)).toThrow();
    });

    it("should throw error when trying to cancel", () => {
      expect(() => cancelledState.cancel(mockReservation)).toThrow();
    });

    it("should throw error when trying to expire", () => {
      expect(() => cancelledState.expire(mockReservation)).toThrow();
    });
  });
});
