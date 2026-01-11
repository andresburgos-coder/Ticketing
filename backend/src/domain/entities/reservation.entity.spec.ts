import { Reservation } from './reservation.entity';
import { TicketType } from '../value-objects/ticket-type.vo';
import { TicketQuantity } from '../value-objects/ticket-quantity.vo';
import { Email } from '../value-objects/email.vo';
import { Money } from '../value-objects/money.vo';
import { InvalidStateTransitionException } from '../exceptions/invalid-state-transition.exception';

/**
 * Unit tests for Reservation entity
 * 
 * Requirements: 3.1, 3.3, 3.4, 4.3, 5.1
 * - 3.1: Reserva se crea con estado "Activa" y permite transiciones
 * - 3.3: Reserva expira automáticamente después de 15 minutos  
 * - 3.4: Retorna ID único de reserva
 * - 4.3: Pago exitoso cambia estado a "Confirmada"
 * - 5.1: Pago fallido cancela reserva
 */
describe('Reservation Entity', () => {
  let validReservationData: {
    id: string;
    eventId: string;
    ticketType: TicketType;
    quantity: TicketQuantity;
    buyerEmail: Email;
    totalAmount: Money;
    expiresAt: Date;
    createdAt: Date;
  };

  beforeEach(() => {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes from now

    validReservationData = {
      id: 'reservation-123',
      eventId: 'event-456',
      ticketType: TicketType.VIP,
      quantity: TicketQuantity.create(2),
      buyerEmail: Email.create('buyer@example.com'),
      totalAmount: Money.create(100000, 'COP'),
      expiresAt,
      createdAt: now,
    };
  });

  describe('Constructor and Initial State', () => {
    it('should create Reservation with estado inicial Active', () => {
      // Arrange & Act
      const reservation = new Reservation(
        validReservationData.id,
        validReservationData.eventId,
        validReservationData.ticketType,
        validReservationData.quantity,
        validReservationData.buyerEmail,
        validReservationData.totalAmount,
        validReservationData.expiresAt,
        validReservationData.createdAt
      );

      // Assert
      expect(reservation.id).toBe(validReservationData.id);
      expect(reservation.eventId).toBe(validReservationData.eventId);
      expect(reservation.ticketType).toBe(validReservationData.ticketType);
      expect(reservation.quantity).toBe(validReservationData.quantity);
      expect(reservation.buyerEmail).toBe(validReservationData.buyerEmail);
      expect(reservation.totalAmount).toBe(validReservationData.totalAmount);
      expect(reservation.expiresAt).toBe(validReservationData.expiresAt);
      expect(reservation.createdAt).toBe(validReservationData.createdAt);
      expect(reservation.status).toBe('ACTIVE');
      expect(reservation.isActive).toBe(true);
    });
  });

  describe('State Transitions', () => {
    let reservation: Reservation;

    beforeEach(() => {
      reservation = new Reservation(
        validReservationData.id,
        validReservationData.eventId,
        validReservationData.ticketType,
        validReservationData.quantity,
        validReservationData.buyerEmail,
        validReservationData.totalAmount,
        validReservationData.expiresAt,
        validReservationData.createdAt
      );
    });

    it('should confirm() cambia estado a Confirmed', () => {
      // Arrange
      expect(reservation.status).toBe('ACTIVE');

      // Act
      reservation.confirm();

      // Assert
      expect(reservation.status).toBe('CONFIRMED');
      expect(reservation.isActive).toBe(false);
    });

    it('should cancel() cambia estado a Cancelled', () => {
      // Arrange
      expect(reservation.status).toBe('ACTIVE');

      // Act
      reservation.cancel();

      // Assert
      expect(reservation.status).toBe('CANCELLED');
      expect(reservation.isActive).toBe(false);
    });

    it('should expire() cambia estado a Expired', () => {
      // Arrange
      expect(reservation.status).toBe('ACTIVE');

      // Act
      reservation.expire();

      // Assert
      expect(reservation.status).toBe('EXPIRED');
      expect(reservation.isActive).toBe(false);
    });
  });

  describe('Expiration Logic', () => {
    it('should isExpired retorna true cuando expiresAt < now', () => {
      // Arrange - Create reservation that expired 1 minute ago
      const pastTime = new Date(Date.now() - 60 * 1000); // 1 minute ago
      const reservation = new Reservation(
        validReservationData.id,
        validReservationData.eventId,
        validReservationData.ticketType,
        validReservationData.quantity,
        validReservationData.buyerEmail,
        validReservationData.totalAmount,
        pastTime, // expiresAt in the past
        validReservationData.createdAt
      );

      // Act & Assert
      expect(reservation.isExpired).toBe(true);
      expect(reservation.status).toBe('ACTIVE'); // Still active until explicitly expired
    });

    it('should isExpired retorna false cuando expiresAt > now', () => {
      // Arrange - Create reservation that expires in the future
      const futureTime = new Date(Date.now() + 60 * 1000); // 1 minute from now
      const reservation = new Reservation(
        validReservationData.id,
        validReservationData.eventId,
        validReservationData.ticketType,
        validReservationData.quantity,
        validReservationData.buyerEmail,
        validReservationData.totalAmount,
        futureTime, // expiresAt in the future
        validReservationData.createdAt
      );

      // Act & Assert
      expect(reservation.isExpired).toBe(false);
      expect(reservation.status).toBe('ACTIVE');
    });

    it('should isExpired retorna false for non-ACTIVE states even if time passed', () => {
      // Arrange - Create expired reservation and confirm it
      const pastTime = new Date(Date.now() - 60 * 1000); // 1 minute ago
      const reservation = new Reservation(
        validReservationData.id,
        validReservationData.eventId,
        validReservationData.ticketType,
        validReservationData.quantity,
        validReservationData.buyerEmail,
        validReservationData.totalAmount,
        pastTime, // expiresAt in the past
        validReservationData.createdAt
      );

      // Act - Confirm the reservation
      reservation.confirm();

      // Assert - Should not be considered expired since it's confirmed
      expect(reservation.isExpired).toBe(false);
      expect(reservation.status).toBe('CONFIRMED');
    });
  });

  describe('Invalid State Transitions', () => {
    it('should throw InvalidStateTransitionException when trying to confirm a confirmed reservation', () => {
      // Arrange
      const reservation = new Reservation(
        validReservationData.id,
        validReservationData.eventId,
        validReservationData.ticketType,
        validReservationData.quantity,
        validReservationData.buyerEmail,
        validReservationData.totalAmount,
        validReservationData.expiresAt,
        validReservationData.createdAt
      );
      reservation.confirm(); // First confirmation

      // Act & Assert
      expect(() => reservation.confirm()).toThrow(InvalidStateTransitionException);
      expect(reservation.status).toBe('CONFIRMED');
    });

    it('should throw InvalidStateTransitionException when trying to cancel a confirmed reservation', () => {
      // Arrange
      const reservation = new Reservation(
        validReservationData.id,
        validReservationData.eventId,
        validReservationData.ticketType,
        validReservationData.quantity,
        validReservationData.buyerEmail,
        validReservationData.totalAmount,
        validReservationData.expiresAt,
        validReservationData.createdAt
      );
      reservation.confirm();

      // Act & Assert
      expect(() => reservation.cancel()).toThrow(InvalidStateTransitionException);
      expect(reservation.status).toBe('CONFIRMED');
    });

    it('should throw InvalidStateTransitionException when trying to expire a confirmed reservation', () => {
      // Arrange
      const reservation = new Reservation(
        validReservationData.id,
        validReservationData.eventId,
        validReservationData.ticketType,
        validReservationData.quantity,
        validReservationData.buyerEmail,
        validReservationData.totalAmount,
        validReservationData.expiresAt,
        validReservationData.createdAt
      );
      reservation.confirm();

      // Act & Assert
      expect(() => reservation.expire()).toThrow(InvalidStateTransitionException);
      expect(reservation.status).toBe('CONFIRMED');
    });
  });
});