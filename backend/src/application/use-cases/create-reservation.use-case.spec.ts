import { CreateReservationUseCase } from './create-reservation.use-case';
import { IEventRepository } from '../../domain/interfaces/event-repository.interface';
import { IReservationRepository } from '../../domain/interfaces/reservation-repository.interface';
import { Event } from '../../domain/entities/event.entity';
import { Reservation } from '../../domain/entities/reservation.entity';
import { TicketConfiguration } from '../../domain/entities/ticket-configuration.entity';
import { TicketType } from '../../domain/value-objects/ticket-type.vo';
import { Money } from '../../domain/value-objects/money.vo';
import { Email } from '../../domain/value-objects/email.vo';
import { TicketQuantity } from '../../domain/value-objects/ticket-quantity.vo';
import { InsufficientTicketsException } from '../../domain/exceptions/insufficient-tickets.exception';

/**
 * CreateReservationUseCase Tests
 * 
 * Tests for the use case that creates temporary ticket reservations.
 * Validates that reservations are created with correct state, expiration time,
 * and that ticket availability is decremented atomically.
 * 
 * Requirements: 3.1, 3.2, 3.4, 3.5
 * - 3.1: Reserva se crea con estado "Activa" y expiración en 15 minutos
 * - 3.2: Disponibilidad se decrementa mientras reserva está activa
 * - 3.4: Retorna ID único de reserva
 * - 3.5: Rechaza si no hay suficientes entradas disponibles
 */
describe('CreateReservationUseCase', () => {
  let useCase: CreateReservationUseCase;
  let mockEventRepository: jest.Mocked<IEventRepository>;
  let mockReservationRepository: jest.Mocked<IReservationRepository>;

  beforeEach(() => {
    // Create mock repositories
    mockEventRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
    };

    mockReservationRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findExpired: jest.fn(),
      update: jest.fn(),
    };

    useCase = new CreateReservationUseCase(
      mockEventRepository,
      mockReservationRepository
    );
  });

  describe('execute', () => {
    it('should create reservation and decrement availability', async () => {
      // Arrange
      const eventId = 'event-123';
      const buyerEmail = Email.create('buyer@example.com');
      const quantity = TicketQuantity.create(2);

      // Create event with available tickets
      const event = new Event(
        eventId,
        'Concierto de Rock',
        new Date('2025-03-15T20:00:00Z'),
        'Estadio Nacional',
        [
          new TicketConfiguration(
            TicketType.VIP,
            Money.create(150000, 'COP'),
            100,
            100 // 100 available
          ),
        ]
      );

      const input = {
        eventId,
        ticketType: TicketType.VIP,
        quantity: 2,
        buyerEmail: 'buyer@example.com',
      };

      mockEventRepository.findById.mockResolvedValue(event);
      mockReservationRepository.save.mockImplementation(async (reservation) => reservation);

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result).toBeInstanceOf(Reservation);
      expect(result.eventId).toBe(eventId);
      expect(result.ticketType).toBe(TicketType.VIP);
      expect(result.quantity.value).toBe(2);
      expect(result.buyerEmail.value).toBe('buyer@example.com');
      expect(result.status).toBe('ACTIVE');
      
      // Verify availability was decremented
      expect(event.getAvailability(TicketType.VIP)).toBe(98); // 100 - 2
      
      // Verify repositories were called
      expect(mockEventRepository.findById).toHaveBeenCalledWith(eventId);
      expect(mockReservationRepository.save).toHaveBeenCalledWith(expect.any(Reservation));
      expect(mockEventRepository.update).toHaveBeenCalledWith(event);
    });

    it('should reject if insufficient tickets available', async () => {
      // Arrange
      const eventId = 'event-456';
      const event = new Event(
        eventId,
        'Festival de Música',
        new Date('2025-04-20T18:00:00Z'),
        'Parque Arvi',
        [
          new TicketConfiguration(
            TicketType.GENERAL,
            Money.create(100000, 'COP'),
            50,
            5 // Only 5 available
          ),
        ]
      );

      const input = {
        eventId,
        ticketType: TicketType.GENERAL,
        quantity: 10, // Requesting more than available
        buyerEmail: 'buyer@example.com',
      };

      mockEventRepository.findById.mockResolvedValue(event);

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(InsufficientTicketsException);
      
      // Verify repository was not called to save
      expect(mockReservationRepository.save).not.toHaveBeenCalled();
    });

    it('should set expiration to 15 minutes from now', async () => {
      // Arrange
      const eventId = 'event-789';
      const event = new Event(
        eventId,
        'Concierto de Jazz',
        new Date('2025-05-10T19:00:00Z'),
        'Teatro Metropolitano',
        [
          new TicketConfiguration(
            TicketType.EARLY_BIRD,
            Money.create(80000, 'COP'),
            200,
            200
          ),
        ]
      );

      const input = {
        eventId,
        ticketType: TicketType.EARLY_BIRD,
        quantity: 1,
        buyerEmail: 'buyer@example.com',
      };

      const beforeTime = new Date();
      const expectedExpirationTime = new Date(beforeTime.getTime() + 15 * 60 * 1000);

      mockEventRepository.findById.mockResolvedValue(event);
      mockReservationRepository.save.mockImplementation(async (reservation) => reservation);

      // Act
      const result = await useCase.execute(input);
      const afterTime = new Date();

      // Assert
      // Expiration should be approximately 15 minutes from now (within 1 second tolerance)
      const expirationDiff = result.expiresAt.getTime() - beforeTime.getTime();
      const expectedDiff = 15 * 60 * 1000;
      expect(Math.abs(expirationDiff - expectedDiff)).toBeLessThan(1000); // Within 1 second
    });

    it('should return reservation with unique ID', async () => {
      // Arrange
      const eventId = 'event-999';
      const event = new Event(
        eventId,
        'Concierto de Rock',
        new Date('2025-03-15T20:00:00Z'),
        'Estadio Nacional',
        [
          new TicketConfiguration(
            TicketType.VIP,
            Money.create(150000, 'COP'),
            100,
            100
          ),
        ]
      );

      const input = {
        eventId,
        ticketType: TicketType.VIP,
        quantity: 1,
        buyerEmail: 'buyer@example.com',
      };

      mockEventRepository.findById.mockResolvedValue(event);
      mockReservationRepository.save.mockImplementation(async (reservation) => reservation);

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.id).toBeDefined();
      expect(typeof result.id).toBe('string');
      expect(result.id.length).toBeGreaterThan(0);
    });
  });
});
