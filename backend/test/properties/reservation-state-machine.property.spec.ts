import * as fc from 'fast-check';
import { IReservationState, Reservation } from '../../src/domain/states/reservation-state.interface';
import { InvalidStateTransitionException } from '../../src/domain/exceptions/invalid-state-transition.exception';
import {
  reservationStatusArbitrary,
  stateActionArbitrary,
  validActiveTransitionArbitrary,
  invalidTerminalTransitionArbitrary,
  createStateFromStatus,
  isValidTransition,
  getExpectedFinalState,
} from './generators/reservation-state.generator';

/**
 * Feature: ticket-sales-system
 * Property 6: Reservation State Machine Validity
 * Validates: Requirements 3.1, 3.3, 5.1
 *
 * *For any* reservation state and action, the state machine should:
 * - Allow valid transitions from ACTIVE state
 * - Reject invalid transitions from terminal states
 * - Maintain state consistency and proper error handling
 */
describe('Property 6: Reservation State Machine Validity', () => {
  const PROPERTY_CONFIG: fc.Parameters<unknown> = {
    numRuns: 100,
    verbose: fc.VerbosityLevel.VeryVerbose,
  };

  // Mock reservation for testing state transitions
  let mockReservation: Reservation;
  let capturedState: IReservationState | null;

  beforeEach(() => {
    capturedState = null;
    mockReservation = {
      setState: jest.fn((state: IReservationState) => {
        capturedState = state;
      }),
    };
  });

  describe('Valid state transitions from ACTIVE state', () => {
    it('should allow any valid transition from ACTIVE state', () => {
      fc.assert(
        fc.property(stateActionArbitrary, (action) => {
          // Arrange
          const activeState = createStateFromStatus('ACTIVE');
          
          // Act & Assert - should not throw
          switch (action) {
            case 'confirm':
              expect(() => activeState.confirm(mockReservation)).not.toThrow();
              expect(capturedState?.name).toBe('CONFIRMED');
              break;
            case 'cancel':
              expect(() => activeState.cancel(mockReservation)).not.toThrow();
              expect(capturedState?.name).toBe('CANCELLED');
              break;
            case 'expire':
              expect(() => activeState.expire(mockReservation)).not.toThrow();
              expect(capturedState?.name).toBe('EXPIRED');
              break;
          }
        }),
        PROPERTY_CONFIG,
      );
    });

    it('should transition to correct final state for any action from ACTIVE', () => {
      fc.assert(
        fc.property(stateActionArbitrary, (action) => {
          // Arrange
          const activeState = createStateFromStatus('ACTIVE');
          const expectedFinalState = getExpectedFinalState('ACTIVE', action);
          
          // Act
          switch (action) {
            case 'confirm':
              activeState.confirm(mockReservation);
              break;
            case 'cancel':
              activeState.cancel(mockReservation);
              break;
            case 'expire':
              activeState.expire(mockReservation);
              break;
          }
          
          // Assert
          expect(capturedState?.name).toBe(expectedFinalState);
        }),
        PROPERTY_CONFIG,
      );
    });
  });

  describe('Invalid state transitions from terminal states', () => {
    it('should reject any transition attempt from terminal states', () => {
      fc.assert(
        fc.property(invalidTerminalTransitionArbitrary, ({ initialState, action }) => {
          // Arrange
          const terminalState = createStateFromStatus(initialState);
          
          // Act & Assert - should throw InvalidStateTransitionException
          switch (action) {
            case 'confirm':
              expect(() => terminalState.confirm(mockReservation)).toThrow(InvalidStateTransitionException);
              expect(() => terminalState.confirm(mockReservation)).toThrow(`Cannot confirm reservation in ${initialState} state`);
              break;
            case 'cancel':
              expect(() => terminalState.cancel(mockReservation)).toThrow(InvalidStateTransitionException);
              expect(() => terminalState.cancel(mockReservation)).toThrow(`Cannot cancel reservation in ${initialState} state`);
              break;
            case 'expire':
              expect(() => terminalState.expire(mockReservation)).toThrow(InvalidStateTransitionException);
              expect(() => terminalState.expire(mockReservation)).toThrow(`Cannot expire reservation in ${initialState} state`);
              break;
          }
        }),
        PROPERTY_CONFIG,
      );
    });
  });

  describe('State machine consistency properties', () => {
    it('should have consistent canXXX() and action behavior for any state', () => {
      fc.assert(
        fc.property(reservationStatusArbitrary, stateActionArbitrary, (status, action) => {
          // Arrange
          const state = createStateFromStatus(status);
          
          // Act - check if action is allowed
          let canPerformAction: boolean;
          let shouldThrow: boolean;
          
          switch (action) {
            case 'confirm':
              canPerformAction = state.canConfirm();
              break;
            case 'cancel':
              canPerformAction = state.canCancel();
              break;
            case 'expire':
              canPerformAction = state.canExpire();
              break;
            default:
              canPerformAction = false;
          }
          
          shouldThrow = !canPerformAction;
          
          // Assert - behavior should match canXXX() result
          switch (action) {
            case 'confirm':
              if (shouldThrow) {
                expect(() => state.confirm(mockReservation)).toThrow(InvalidStateTransitionException);
              } else {
                expect(() => state.confirm(mockReservation)).not.toThrow();
              }
              break;
            case 'cancel':
              if (shouldThrow) {
                expect(() => state.cancel(mockReservation)).toThrow(InvalidStateTransitionException);
              } else {
                expect(() => state.cancel(mockReservation)).not.toThrow();
              }
              break;
            case 'expire':
              if (shouldThrow) {
                expect(() => state.expire(mockReservation)).toThrow(InvalidStateTransitionException);
              } else {
                expect(() => state.expire(mockReservation)).not.toThrow();
              }
              break;
          }
        }),
        PROPERTY_CONFIG,
      );
    });

    it('should maintain state immutability: state name never changes', () => {
      fc.assert(
        fc.property(reservationStatusArbitrary, (status) => {
          // Arrange
          const state = createStateFromStatus(status);
          const originalName = state.name;
          
          // Act - try various operations (that might fail)
          try {
            state.confirm(mockReservation);
          } catch (e) {
            // Ignore expected exceptions
          }
          
          try {
            state.cancel(mockReservation);
          } catch (e) {
            // Ignore expected exceptions
          }
          
          try {
            state.expire(mockReservation);
          } catch (e) {
            // Ignore expected exceptions
          }
          
          // Assert - state name should never change
          expect(state.name).toBe(originalName);
          expect(state.name).toBe(status);
        }),
        PROPERTY_CONFIG,
      );
    });
  });

  describe('State machine determinism properties', () => {
    it('should always create states with correct names', () => {
      fc.assert(
        fc.property(reservationStatusArbitrary, (status) => {
          // Arrange & Act
          const state = createStateFromStatus(status);
          
          // Assert - state name should match the status
          expect(state.name).toBe(status);
        }),
        PROPERTY_CONFIG,
      );
    });
  });
});